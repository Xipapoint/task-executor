import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueInjectionTokens } from '../constants/injection-tokens';
import { BaseTaskContract } from '../contracts/request/base-task.contract';
import { SSENotificationService } from '../sse/sse-notification.service';
import { KafkaConsumerService } from './consumer/kafka-consumer.service';
import { KafkaPendingRequestsService } from './pending-requests/kafka-pending-requests.service';
import { KafkaProducerService } from './producer/kafka-producer.service';

@Injectable()
export class KafkaOrchestrator implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaOrchestrator.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(QueueInjectionTokens.KAFKA_PENDING_REQUESTS_SERVICE)
    private readonly pendingRequestsService: KafkaPendingRequestsService,
    @Inject(QueueInjectionTokens.SSE_NOTIFICATION_SERVICE)
    private readonly sseNotificationService: SSENotificationService,
    @Inject(QueueInjectionTokens.KAFKA_CONSUMER_SERVICE)
    private readonly consumerService: KafkaConsumerService,
    @Inject(QueueInjectionTokens.KAFKA_PRODUCER_SERVICE)
    private readonly producerService: KafkaProducerService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Kafka orchestrator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka orchestrator', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumerService?.onModuleDestroy();
      await this.producerService?.onModuleDestroy();
      this.logger.log('Kafka orchestrator destroyed');
    } catch (error) {
      this.logger.error('Error during Kafka orchestrator destruction', error);
    }
  }
  
  async sendMessage(topic: string, message: BaseTaskContract): Promise<void> {
    const serializedMessage = {
      ...message,
      value: typeof message.value === 'string' ? message.value : JSON.stringify(message.value),
    };

    await this.producerService.sendMessage(topic, serializedMessage);
  }

  async sendRequest<T>(
    topic: string,
    request: BaseTaskContract,
    timeoutMs = 30000
  ): Promise<T> {
    const requestId = this.generateRequestId();
    
    // Add request ID to the message
    const messageWithId = {
      ...request,
      value: {
        ...request.value,
        id: requestId,
      },
      headers: {
        ...request.headers,
        'x-request-id': requestId,
      },
    };

    // Set up pending request tracking
    const { promise, cleanup } = await this.pendingRequestsService.addPendingRequest(
      requestId,
      timeoutMs
    );

    try {
      // Send the message
      await this.sendMessage(topic, messageWithId);
      
      // Wait for response
      const response = await promise;
      return response as T;
    } catch (error) {
      this.logger.error(`Request ${requestId} failed`, error);
      throw error;
    } finally {
      cleanup();
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check methods
  isHealthy(): boolean {
    return this.consumerService?.isConsumerConnected() && 
           this.producerService?.isProducerConnected();
  }

  getStatus(): {
    consumer: boolean;
    producer: boolean;
    pendingRequests: number;
    sseClients: number;
  } {
    const metrics = this.pendingRequestsService.getMetrics();
    const sseClients = this.sseNotificationService.getConnectedClients();

    return {
      consumer: this.consumerService?.isConsumerConnected() || false,
      producer: this.producerService?.isProducerConnected() || false,
      pendingRequests: metrics.localPendingCount,
      sseClients: sseClients.length,
    };
  }
}
