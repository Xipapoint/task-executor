export interface KafkaProducerConfig {
  clientId: string;
  brokers: string[];
  maxInFlightRequests?: number;
  retry?: {
    retries: number;
    initialRetryTime: number;
    multiplier: number;
    maxRetryTime: number;
  };
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain';
    username: string;
    password: string;
  } | {
    mechanism: 'scram-sha-256';
    username: string;
    password: string;
  } | {
    mechanism: 'scram-sha-512';
    username: string;
    password: string;
  };
}