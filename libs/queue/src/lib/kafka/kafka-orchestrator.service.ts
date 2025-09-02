import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaConsumerService } from './consumer/kafka-consumer.service';
import { KafkaProducerService } from './producer/kafka-producer.service';
import { KafkaPendingRequestsService } from './pending-requests/kafka-pending-requests.service';
import { ReplyTopicHandler } from './handlers/reply-topic.handler';
import { TaskNotificationHandler } from './handlers/task-notification.handler';
import { SSENotificationService } from '../sse/sse-notification.service';
import { KafkaTopics } from '../constants/kafka.constants';

@Injectable()
export class KafkaOrchestrator implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaOrchestrator.name);
  private consumerService: KafkaConsumerService;
  private producerService: KafkaProducerService;

  constructor(
    private readonly configService: ConfigService,
    private readonly pendingRequestsService: KafkaPendingRequestsService,
    private readonly sseNotificationService: SSENotificationService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.initializeServices();
      await this.registerHandlers();
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

  private async initializeServices(): Promise<void> {
    const brokers = this.getBrokers();
    const clientId = this.getClientId();
    const groupId = this.getGroupId();

    // Initialize consumer
    this.consumerService = new KafkaConsumerService({
      clientId: `${clientId}-consumer`,
      groupId,
      brokers,
      topics: [
        'reply-topic',
        KafkaTopics.USER_LOGIN,
        KafkaTopics.PURCHASED,
        KafkaTopics.MESSAGE_SENT,
        KafkaTopics.ALERT_TRIGGERED,
      ],
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 60000,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });

    // Initialize producer
    this.producerService = new KafkaProducerService({
      clientId: `${clientId}-producer`,
      brokers,
      maxInFlightRequests: 5,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });

    await this.consumerService.onModuleInit();
    await this.producerService.onModuleInit();
  }

  private async registerHandlers(): Promise<void> {
    // Register reply topic handler for pending requests
    const replyHandler = new ReplyTopicHandler(this.pendingRequestsService);
    this.consumerService.registerHandler('reply-topic', replyHandler);

    // Register notification handlers for each topic
    const notificationHandler = new TaskNotificationHandler(this.sseNotificationService);
    
    this.consumerService.registerHandler(KafkaTopics.USER_LOGIN, notificationHandler);
    this.consumerService.registerHandler(KafkaTopics.PURCHASED, notificationHandler);
    this.consumerService.registerHandler(KafkaTopics.MESSAGE_SENT, notificationHandler);
    this.consumerService.registerHandler(KafkaTopics.ALERT_TRIGGERED, notificationHandler);

    this.logger.log('All Kafka handlers registered successfully');
  }

  private getBrokers(): string[] {
    const brokersStr = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092');
    return brokersStr.split(',').map(broker => broker.trim());
  }

  private getClientId(): string {
    return this.configService.get<string>('KAFKA_CLIENT_ID', 'message-system-service');
  }

  private getGroupId(): string {
    return this.configService.get<string>('KAFKA_GROUP_ID', 'message-system-group');
  }

  // Public methods for sending messages
  async sendMessage(topic: string, message: {
    key?: string;
    value: unknown;
    headers?: Record<string, string | Buffer>;
  }): Promise<void> {
    const serializedMessage = {
      ...message,
      value: typeof message.value === 'string' ? message.value : JSON.stringify(message.value),
    };

    await this.producerService.sendMessage(topic, serializedMessage);
  }

  async sendRequest<T>(
    topic: string,
    request: {
      key?: string;
      value: unknown;
      headers?: Record<string, string | Buffer>;
    },
    timeoutMs = 30000
  ): Promise<T> {
    const requestId = this.generateRequestId();
    
    // Add request ID to the message
    const messageWithId = {
      ...request,
      value: {
        ...(typeof request.value === 'object' ? request.value : { data: request.value }),
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
