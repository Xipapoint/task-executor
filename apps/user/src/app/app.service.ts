import { Injectable, Inject } from '@nestjs/common';
import { QueueInjectionTokens, KafkaOrchestrator, SSENotificationService } from '@message-system/queue';

@Injectable()
export class AppService {
  constructor(
    @Inject(QueueInjectionTokens.KAFKA_ORCHESTRATOR)
    private readonly kafkaOrchestrator: KafkaOrchestrator,
    @Inject(QueueInjectionTokens.SSE_NOTIFICATION_SERVICE)
    private readonly sseService: SSENotificationService,
  ) {}

  getStatus(): { message: string; service: string; timestamp: string } {
    return {
      message: 'User service is running',
      service: 'message-system-user',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth(): { status: string; timestamp: string } {
    // Example: Get health status from Kafka orchestrator
    const kafkaStatus = this.kafkaOrchestrator.getStatus();
    const sseClients = this.sseService.getConnectedClients();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      kafka: kafkaStatus,
      sseClients: sseClients.length,
    };
  }

  async sendNotification(message: any): Promise<void> {
    // Example: Send notification via SSE
    this.sseService.broadcast('general', {
      event: 'user_notification',
      data: {
        ...message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async publishMessage(topic: string, payload: any): Promise<void> {
    // Example: Send message via Kafka
    await this.kafkaOrchestrator.sendMessage(topic, {
      value: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
