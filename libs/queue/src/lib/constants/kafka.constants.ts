import { MessageTaskContract } from '../contracts/request/message-task/message-task.contract';
import { SSEMessage } from '../sse/sse-notification.service';


export enum KafkaKeys {
  USER_LOGIN = 'USER_LOGIN',
  PURCHASED = 'PURCHASED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  REPLY_TOPIC = 'REPLY_TOPIC',
}

export enum KafkaTopics {
  LOGGING = 'logging',
  METRICS = 'metrics',
  REPLY_TOPIC = 'reply_topic',
}

export enum KafkaGroups {
  PRODUCER = 'producer-group',
  TASK_SERVICE = 'task-service-group',
  ANALYTICS_SERVICE = 'analytics-service-group',
}



export const RETURN_MESSAGES: Record<KafkaTopics, (payload: unknown, type: string) => SSEMessage | null> = {
  [KafkaTopics.LOGGING]: (payload: unknown, type: string) => ({
    id: `logging-${Date.now()}`,
    data: {
      topic: KafkaTopics.LOGGING,
      timestamp: new Date().toISOString(),
      payload,
      type
    }
  }),
  [KafkaTopics.METRICS]: (payload: unknown, type: string) => ({
    id: `metrics-${Date.now()}`,
    data: {
      topic: KafkaTopics.METRICS,
      timestamp: new Date().toISOString(),
      payload,
      type
    }
  }),
  [KafkaTopics.REPLY_TOPIC]: function (payload: unknown, type: string): SSEMessage | null {
    throw new Error('Function not implemented.');
  }
}

export type PartitionContractMap = {
  [KafkaKeys.MESSAGE_SENT]: MessageTaskContract;
}

export type KafkaMessageValueType<T extends keyof PartitionContractMap> = PartitionContractMap[T];