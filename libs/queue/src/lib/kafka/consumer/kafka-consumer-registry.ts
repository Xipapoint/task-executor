import { Injectable, Inject } from "@nestjs/common";
import { KafkaTopics } from '../../constants/kafka.constants';
import { ConsumerHandler } from '../interfaces';
import { QueueInjectionTokens } from '../../constants/injection-tokens';


@Injectable()
export class KafkaConsumerRegistry {
  constructor(
    @Inject(QueueInjectionTokens.REPLY_TOPIC_HANDLER)
    private readonly replyTopicHandler: ConsumerHandler,
    @Inject(QueueInjectionTokens.TASK_NOTIFICATION_HANDLER)
    private readonly taskNotificationHandler: ConsumerHandler,
  ) {}

  public readonly KAFKA_TOPICS_HANDLERS: Map<KafkaTopics, ConsumerHandler> = new Map([
    [KafkaTopics.REPLY_TOPIC, this.replyTopicHandler],
    [KafkaTopics.LOGGING, this.taskNotificationHandler],
    [KafkaTopics.METRICS, this.taskNotificationHandler],
  ]);
}