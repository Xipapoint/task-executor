import { ConfigService } from "@nestjs/config";
import { KafkaProducerConfig } from '../../interfaces';

export const getKafkaProducerConfig = (configService: ConfigService): KafkaProducerConfig => {
  const brokers = configService.get<string>('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map(b => b.trim());

  return {
    clientId: `${configService.get<string>('KAFKA_CLIENT_ID', 'message-system-service')}-producer`,
    brokers,
    maxInFlightRequests: parseInt(configService.get<string>('KAFKA_MAX_IN_FLIGHT_REQUESTS', '5'), 10),
    retry: {
      retries: parseInt(configService.get<string>('KAFKA_RETRY_RETRIES', '5'), 10),
      initialRetryTime: parseInt(configService.get<string>('KAFKA_RETRY_INITIAL_TIME', '300'), 10),
      multiplier: parseInt(configService.get<string>('KAFKA_RETRY_MULTIPLIER', '2'), 10),
      maxRetryTime: parseInt(configService.get<string>('KAFKA_RETRY_MAX_TIME', '30000'), 10),
    },
  };
};