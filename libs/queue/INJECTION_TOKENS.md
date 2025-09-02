# Queue Module - Injection Tokens

Данный модуль теперь использует Injection Tokens для внедрения зависимостей, что обеспечивает более чистую архитектуру и лучшую тестируемость.

## Доступные Injection Tokens

```typescript
export enum QueueInjectionTokens {
  // Kafka services
  KAFKA_ORCHESTRATOR = 'KAFKA_ORCHESTRATOR',
  KAFKA_PENDING_REQUESTS_SERVICE = 'KAFKA_PENDING_REQUESTS_SERVICE',
  KAFKA_CONSUMER_SERVICE = 'KAFKA_CONSUMER_SERVICE',
  KAFKA_PRODUCER_SERVICE = 'KAFKA_PRODUCER_SERVICE',
  KAFKA_CONSUMER_REGISTRY = 'KAFKA_CONSUMER_REGISTRY',
  
  // SSE services
  SSE_NOTIFICATION_SERVICE = 'SSE_NOTIFICATION_SERVICE',
  
  // Health and monitoring
  KAFKA_HEALTH_SERVICE = 'KAFKA_HEALTH_SERVICE',
  
  // Handlers
  REPLY_TOPIC_HANDLER = 'REPLY_TOPIC_HANDLER',
  TASK_NOTIFICATION_HANDLER = 'TASK_NOTIFICATION_HANDLER',
}
```

## Использование в ваших сервисах

### Пример 1: Использование KafkaOrchestrator

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { QueueInjectionTokens } from '@message-system/queue';
import { KafkaOrchestrator } from '@message-system/queue';

@Injectable()
export class YourService {
  constructor(
    @Inject(QueueInjectionTokens.KAFKA_ORCHESTRATOR)
    private readonly kafkaOrchestrator: KafkaOrchestrator
  ) {}

  async sendMessage() {
    await this.kafkaOrchestrator.sendMessage('your-topic', {
      value: { message: 'Hello World' }
    });
  }
}
```

### Пример 2: Использование SSE Notification Service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { QueueInjectionTokens } from '@message-system/queue';
import { SSENotificationService } from '@message-system/queue';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(QueueInjectionTokens.SSE_NOTIFICATION_SERVICE)
    private readonly sseService: SSENotificationService
  ) {}

  async notifyUsers(message: any) {
    this.sseService.broadcast('general', {
      event: 'user_notification',
      data: message
    });
  }
}
```

### Пример 3: Создание custom модуля с переопределением providers

```typescript
import { Module } from '@nestjs/common';
import { QueueModule, QueueInjectionTokens } from '@message-system/queue';
import { CustomKafkaOrchestrator } from './custom-kafka-orchestrator';

@Module({
  imports: [QueueModule],
  providers: [
    {
      provide: QueueInjectionTokens.KAFKA_ORCHESTRATOR,
      useClass: CustomKafkaOrchestrator, // Ваша кастомная реализация
    }
  ],
  exports: [QueueInjectionTokens.KAFKA_ORCHESTRATOR]
})
export class CustomQueueModule {}
```

## Преимущества использования Injection Tokens

1. **Тестируемость**: Легко мокать зависимости в тестах
2. **Гибкость**: Возможность переопределять implementations
3. **Явность**: Четкое понимание зависимостей
4. **Типобезопасность**: TypeScript проверяет типы на этапе компиляции

## Тестирование

### Пример unit теста

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { QueueInjectionTokens } from '@message-system/queue';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;
  let mockKafkaOrchestrator: jest.Mocked<any>;

  beforeEach(async () => {
    mockKafkaOrchestrator = {
      sendMessage: jest.fn(),
      sendRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: QueueInjectionTokens.KAFKA_ORCHESTRATOR,
          useValue: mockKafkaOrchestrator,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should send message via kafka orchestrator', async () => {
    await service.sendMessage();
    
    expect(mockKafkaOrchestrator.sendMessage).toHaveBeenCalledWith(
      'your-topic',
      { value: { message: 'Hello World' } }
    );
  });
});
```
