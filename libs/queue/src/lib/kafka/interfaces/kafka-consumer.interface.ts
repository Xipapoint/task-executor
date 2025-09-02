export interface KafkaConsumerConfig {
  groupId: string;
  clientId: string;
  topics: string[];
  brokers: string[];
  sessionTimeout?: number;
  heartbeatInterval?: number;
  rebalanceTimeout?: number;
  retry?: {
    retries: number;
    initialRetryTime: number;
    multiplier: number;
    maxRetryTime: number;
  };
}

export interface KafkaMessage<T = unknown> {
  topic: string;
  partition: number;
  offset: string;
  key?: string | Buffer | null;
  value: T;
  timestamp: string;
  headers?: Record<string, string | Buffer>;
}

export interface ConsumerHandler<T = unknown> {
  handle(message: KafkaMessage<T>): Promise<void>;
}

export interface PendingRequest {
  requestId: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timestamp: number;
  timeout?: NodeJS.Timeout;
}
