import { ConfigService } from "@nestjs/config";
import { KafkaConfig } from "kafkajs";
import { KafkaConsumerConfig } from '../../interfaces';

export const getKafkaConsumerConfig = (configService: ConfigService): KafkaConsumerConfig => {
  const brokers = configService.get<string>('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map(b => b.trim());

  const topics = configService.get<string>('KAFKA_TOPICS', '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  return {
    clientId: `${configService.get<string>('KAFKA_CLIENT_ID', 'message-system-service')}-consumer`,
    groupId: configService.get<string>('KAFKA_GROUP_ID', 'message-system-group'),
    brokers,
    topics,
    sessionTimeout: parseInt(configService.get<string>('KAFKA_SESSION_TIMEOUT', '30000'), 10),
    heartbeatInterval: parseInt(configService.get<string>('KAFKA_HEARTBEAT_INTERVAL', '3000'), 10),
    rebalanceTimeout: parseInt(configService.get<string>('KAFKA_REBALANCE_TIMEOUT', '60000'), 10),
    retry: {
      retries: parseInt(configService.get<string>('KAFKA_RETRY_RETRIES', '5'), 10),
      initialRetryTime: parseInt(configService.get<string>('KAFKA_RETRY_INITIAL_TIME', '300'), 10),
      multiplier: parseInt(configService.get<string>('KAFKA_RETRY_MULTIPLIER', '2'), 10),
      maxRetryTime: parseInt(configService.get<string>('KAFKA_RETRY_MAX_TIME', '30000'), 10),
    },
  };
};