import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@message-system/cache';

// Kafka services
import { KafkaOrchestrator } from './kafka/kafka-orchestrator.service';
import { KafkaPendingRequestsService } from './kafka/pending-requests/kafka-pending-requests.service';
import { SSENotificationService } from './sse/sse-notification.service';

// Health and monitoring
import { KafkaHealthService } from './health/kafka-health.service';

// Controllers
import { KafkaMessagingController } from './controllers/kafka-messaging.controller';
import { KafkaHealthController } from './controllers/kafka-health.controller';

// Legacy services
import { TaskProducerService } from './task.producer.';

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
    // New Kafka infrastructure
    KafkaOrchestrator,
    KafkaPendingRequestsService,
    SSENotificationService,
    
    // Health and monitoring
    KafkaHealthService,
    
    // Legacy producer service (for backward compatibility)
    TaskProducerService,
  ],
  exports: [
    // Export new services
    KafkaOrchestrator,
    KafkaPendingRequestsService,
    SSENotificationService,
    KafkaHealthService,
    
    // Export legacy service for compatibility
    TaskProducerService,
  ],
})
export class QueueModule {}
