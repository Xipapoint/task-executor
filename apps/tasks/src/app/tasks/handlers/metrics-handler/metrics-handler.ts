import { ConsumerHandler, KafkaKeys, KafkaMessage, KafkaOrchestrator, KafkaTopics, MessageTaskContract, PartitionContractMap, QueueInjectionTokens } from "@message-system/queue";
import { Inject, Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TaskMetricsHandler implements ConsumerHandler {
  private readonly logger = new Logger(TaskMetricsHandler.name);

  constructor(
    @Inject(QueueInjectionTokens.KAFKA_ORCHESTRATOR)
    private readonly kafkaOrchestrator: KafkaOrchestrator,
  ) {}

  async handle(message: KafkaMessage<PartitionContractMap[KafkaKeys.MESSAGE_SENT]>): Promise<void> {
    try {
      const { topic, value: kafkaValue, headers: kafkaHeaders } = message;

      const metricsMessage: MessageTaskContract = {
        ...kafkaValue,
        headers: {
          ...kafkaHeaders,
          'source-topic': topic,
          'timestamp': new Date().toISOString(),
        }
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
