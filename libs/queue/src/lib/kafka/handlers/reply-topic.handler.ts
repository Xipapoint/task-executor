import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConsumerHandler, KafkaMessage } from '../interfaces/kafka-consumer.interface';
import { KafkaPendingRequestsService } from '../pending-requests/kafka-pending-requests.service';
import { TaskResponseContract } from '../../contracts';
import { QueueInjectionTokens } from '../../constants/injection-tokens';

@Injectable()
export class ReplyTopicHandler implements ConsumerHandler {
  private readonly logger = new Logger(ReplyTopicHandler.name);

  constructor(
    @Inject(QueueInjectionTokens.KAFKA_PENDING_REQUESTS_SERVICE)
    private readonly pendingRequestsService: KafkaPendingRequestsService
  ) {}

  async handle(message: KafkaMessage<TaskResponseContract>): Promise<void> {
    try {
      const response = message.value;
      
      if (!response || typeof response !== 'object' || !('id' in response)) {
        this.logger.warn('Invalid reply message format', { message: message.value });
        return;
      }

      const requestId = response.id;
      if (!requestId) {
        this.logger.warn('Reply message missing request ID', { response });
        return;
      }

      this.logger.debug(`Processing reply for request ${requestId}`, { response });

      // Determine if this is an error response
      const isError = response.status === 'error';
      const errorMessage = isError ? (response.error || 'Unknown error') : undefined;

      // Publish the reply to Redis for cross-pod synchronization
      await this.pendingRequestsService.publishReply(
        requestId,
        isError ? undefined : response,
        errorMessage
      );

      this.logger.debug(`Reply processed for request ${requestId}`);
    } catch (error) {
      this.logger.error('Error handling reply message', error, { 
        topic: message.topic,
        offset: message.offset,
        partition: message.partition 
      });
      throw error;
    }
  }
}
