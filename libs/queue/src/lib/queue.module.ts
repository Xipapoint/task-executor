import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@message-system/cache';

// Kafka services
import { KafkaOrchestrator } from './kafka/kafka-orchestrator.service';
import { KafkaPendingRequestsService } from './kafka/pending-requests/kafka-pending-requests.service';
import { KafkaConsumerService } from './kafka/consumer/kafka-consumer.service';
import { KafkaProducerService } from './kafka/producer/kafka-producer.service';
import { SSENotificationService } from './sse/sse-notification.service';

// Health and monitoring
import { KafkaHealthService } from './health/kafka-health.service';

// Controllers
import { KafkaMessagingController } from './controllers/kafka-messaging.controller';
import { KafkaHealthController } from './controllers/kafka-health.controller';
import { KafkaConsumerRegistry } from './kafka/consumer/kafka-consumer-registry';

// Handlers
import { ReplyTopicHandler } from './kafka/handlers/reply-topic.handler';
import { TaskNotificationHandler } from './kafka/handlers/task-notification.handler';

// Injection tokens
import { QueueInjectionTokens } from './constants/injection-tokens';


@Global()
@Module({
  imports: [
    ConfigModule,
    CacheModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    KafkaMessagingController,
    KafkaHealthController,
  ],
  providers: [
    // Kafka infrastructure services
    {
      provide: QueueInjectionTokens.KAFKA_ORCHESTRATOR,
      useClass: KafkaOrchestrator,
    },
    {
      provide: QueueInjectionTokens.KAFKA_PENDING_REQUESTS_SERVICE,
      useClass: KafkaPendingRequestsService,
    },
    {
      provide: QueueInjectionTokens.KAFKA_CONSUMER_SERVICE,
      useClass: KafkaConsumerService,
    },
    {
      provide: QueueInjectionTokens.KAFKA_PRODUCER_SERVICE,
      useClass: KafkaProducerService,
    },
    {
      provide: QueueInjectionTokens.KAFKA_CONSUMER_REGISTRY,
      useClass: KafkaConsumerRegistry,
    },
    
    // SSE services
    {
      provide: QueueInjectionTokens.SSE_NOTIFICATION_SERVICE,
      useClass: SSENotificationService,
    },
    
    // Handlers
    {
      provide: QueueInjectionTokens.REPLY_TOPIC_HANDLER,
      useClass: ReplyTopicHandler,
    },
    {
      provide: QueueInjectionTokens.TASK_NOTIFICATION_HANDLER,
      useClass: TaskNotificationHandler,
    },
    
    // Health and monitoring
    {
      provide: QueueInjectionTokens.KAFKA_HEALTH_SERVICE,
      useClass: KafkaHealthService,
    },
    
  ],
  exports: [
    // Export services via injection tokens
    QueueInjectionTokens.KAFKA_ORCHESTRATOR,
    QueueInjectionTokens.KAFKA_PENDING_REQUESTS_SERVICE,
    QueueInjectionTokens.KAFKA_CONSUMER_SERVICE,
    QueueInjectionTokens.KAFKA_PRODUCER_SERVICE,
    QueueInjectionTokens.SSE_NOTIFICATION_SERVICE,
    QueueInjectionTokens.KAFKA_HEALTH_SERVICE,
    QueueInjectionTokens.KAFKA_CONSUMER_REGISTRY,
    
  ],
})
export class QueueModule {}
