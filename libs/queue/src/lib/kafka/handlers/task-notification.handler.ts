import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConsumerHandler, KafkaMessage } from '../interfaces/kafka-consumer.interface';
import { SSENotificationService, SSEMessage } from '../../sse/sse-notification.service';
import { KafkaTopics } from '../../constants/kafka.constants';
import { QueueInjectionTokens } from '../../constants/injection-tokens';

@Injectable()
export class TaskNotificationHandler implements ConsumerHandler {
  private readonly logger = new Logger(TaskNotificationHandler.name);

  constructor(
    @Inject(QueueInjectionTokens.SSE_NOTIFICATION_SERVICE)
    private readonly sseService: SSENotificationService
  ) {}

  async handle(message: KafkaMessage): Promise<void> {
    try {
      const { topic, value } = message;
      
      // Create notification message based on topic
      const notificationMessage = this.createNotificationMessage(topic, value);
      
      if (!notificationMessage) {
        this.logger.debug(`No notification created for topic: ${topic}`);
        return;
      }

      // Determine the appropriate channel for broadcasting
      const channel = this.getChannelForTopic(topic);
      
      // Broadcast to all subscribed SSE clients
      this.sseService.broadcast(channel, notificationMessage);
      
      this.logger.debug(`Notification sent for topic ${topic} on channel ${channel}`);
    } catch (error) {
      this.logger.error('Error handling task notification', error, {
        topic: message.topic,
        offset: message.offset,
        partition: message.partition
      });
      // Don't throw error to avoid affecting other message processing
    }
  }

  private createNotificationMessage(topic: string, payload: unknown): SSEMessage | null {
    const timestamp = new Date().toISOString();
    const baseMessage = {
      id: `${topic}-${Date.now()}`,
      event: 'task_update',
      data: {
        topic,
        timestamp,
        payload,
      },
    };

    switch (topic) {
      case KafkaTopics.USER_LOGIN:
        return {
          ...baseMessage,
          event: 'user_login',
          data: {
            ...baseMessage.data,
            type: 'authentication',
            message: 'User login activity detected',
          },
        };

      case KafkaTopics.PURCHASED:
        return {
          ...baseMessage,
          event: 'purchase',
          data: {
            ...baseMessage.data,
            type: 'transaction',
            message: 'Purchase completed',
          },
        };

      case KafkaTopics.MESSAGE_SENT:
        return {
          ...baseMessage,
          event: 'message',
          data: {
            ...baseMessage.data,
            type: 'communication',
            message: 'Message sent',
          },
        };

      case KafkaTopics.ALERT_TRIGGERED:
        return {
          ...baseMessage,
          event: 'alert',
          data: {
            ...baseMessage.data,
            type: 'alert',
            message: 'Alert triggered',
            priority: this.getAlertPriority(payload),
          },
        };

      default:
        return {
          ...baseMessage,
          event: 'task_generic',
          data: {
            ...baseMessage.data,
            type: 'generic',
            message: `Task update for ${topic}`,
          },
        };
    }
  }

  private getChannelForTopic(topic: string): string {
    // Map topics to SSE channels
    const topicChannelMap: Record<string, string> = {
      [KafkaTopics.USER_LOGIN]: 'auth',
      [KafkaTopics.PURCHASED]: 'payments',
      [KafkaTopics.MESSAGE_SENT]: 'messages',
      [KafkaTopics.ALERT_TRIGGERED]: 'alerts',
    };

    return topicChannelMap[topic] || 'general';
  }

  private getAlertPriority(payload: unknown): string {
    // Extract priority from alert payload
    if (payload && typeof payload === 'object' && 'severity' in payload) {
      const alertPayload = payload as { severity?: string };
      return alertPayload.severity || 'medium';
    }
    return 'medium';
  }
}
