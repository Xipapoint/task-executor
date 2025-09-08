import { ConsumerHandler, KafkaHandlerMetricsMessage, KafkaMessage, KafkaOrchestrator, KafkaTopics, QueueInjectionTokens } from "@message-system/queue";
import { Inject, Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TaskMetricsHandler implements ConsumerHandler {
  private readonly logger = new Logger(TaskMetricsHandler.name);

  constructor(
    @Inject(QueueInjectionTokens.KAFKA_ORCHESTRATOR)
    private readonly kafkaOrchestrator: KafkaOrchestrator,
  ) {}

  async handle(message: KafkaMessage): Promise<void> {
    try {
      const { topic, value } = message;

      const metricsMessage: KafkaHandlerMetricsMessage = {
        message: `Metrics for topic ${topic}: ${JSON.stringify(value)}`
      };

      this.kafkaOrchestrator.sendMessage(KafkaTopics.REPLY_TOPIC, metricsMessage)
      
    } catch (error) {
      this.logger.error('Error handling task notification', error, {
        topic: message.topic,
        offset: message.offset,
        partition: message.partition
      });
    }
  }
}
