// Export Kafka infrastructure
export * from './lib/kafka/kafka-orchestrator.service';
export * from './lib/kafka/consumer/kafka-consumer.service';
export * from './lib/kafka/producer/kafka-producer.service';
export * from './lib/kafka/pending-requests/kafka-pending-requests.service';

// Export SSE
export * from './lib/sse/sse-notification.service';

// Export handlers
export * from './lib/kafka/handlers/reply-topic.handler';
export * from './lib/kafka/handlers/task-notification.handler';

// Export interfaces
export * from './lib/kafka/interfaces/kafka-consumer.interface';
export * from './lib/interfaces/metrics.interface';

// Export health and monitoring
export * from './lib/health/kafka-health.service';

// Export controllers
export * from './lib/controllers/kafka-messaging.controller';
export * from './lib/controllers/kafka-health.controller';

// Export constants
export * from './lib/constants';

// Export injection tokens
export { QueueInjectionTokens } from './lib/constants/injection-tokens';

// Export contracts (existing)
export * from './lib/contracts';

// Export legacy services
export * from './lib/task.producer.';

// Export module
export * from './lib/queue.module';
