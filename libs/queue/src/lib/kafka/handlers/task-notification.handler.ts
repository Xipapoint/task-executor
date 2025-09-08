import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConsumerHandler, KafkaMessage } from '../interfaces/kafka-consumer.interface';
import { SSENotificationService, SSEMessage } from '../../sse/sse-notification.service';
import { KafkaTopics, RETURN_MESSAGES } from '../../constants/kafka.constants';
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
      
      const notificationMessage = this.createNotificationMessage(topic, value);
      
      if (!notificationMessage) {
        this.logger.debug(`No notification created for topic: ${topic}`);
        return;
      }

      const channel = this.getChannelForTopic(topic);
      
      this.sseService.broadcast(channel, notificationMessage);
      
      this.logger.debug(`Notification sent for topic ${topic} on channel ${channel}`);
    } catch (error) {
      this.logger.error('Error handling task notification', error, {
        topic: message.topic,
        offset: message.offset,
        partition: message.partition
      });
    }
  }

  private createNotificationMessage(topic: string, payload: unknown): SSEMessage | null {
    return RETURN_MESSAGES[topic as KafkaTopics]
      ? RETURN_MESSAGES[topic as KafkaTopics](payload, topic)
      : (() => {
          this.logger.warn(`No message handler for topic: ${topic}`);
          return null;
        })();
  }

  private getChannelForTopic(topic: string): string {
    const topicChannelMap: Record<string, string> = {
      [KafkaTopics.LOGGING]: 'logging',
      [KafkaTopics.METRICS]: 'metrics',
      [KafkaTopics.REPLY_TOPIC]: 'replies',
    };

    return topicChannelMap[topic] || 'general';
  }

  private getAlertPriority(payload: unknown): string {
    if (payload && typeof payload === 'object' && 'severity' in payload) {
      const alertPayload = payload as { severity?: string };
      return alertPayload.severity || 'medium';
    }
    return 'medium';
  }
}
