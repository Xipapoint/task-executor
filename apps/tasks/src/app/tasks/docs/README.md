# Task System

This module implements a flexible task execution system for the tasks application. It includes different types of tasks that can be executed asynchronously.

## Architecture

The task system follows a factory pattern with the following components:

### Core Components

1. **AbstractTask** - Base abstract class that all task types extend from
2. **TaskFactory** - Factory class that creates appropriate task instances
3. **TaskService** - Service class that orchestrates task execution
4. **TaskController** - REST API controller with endpoints for task operations

### Task Types

The system supports the following task types:

1. **UserLoginTask** (`user_login`) - Handles user login events
2. **PurchasedTask** (`purchased`) - Handles purchase completion events
3. **MessageSentTask** (`message_sent`) - Handles message sending events
4. **AlertTriggeredTask** (`alert_triggered`) - Handles alert triggering events

## API Endpoints

### Execute Single Task
```
POST /api/tasks/execute
Content-Type: application/json

{
  "taskType": "user_login",
  "payload": {
    "userId": "user123",
    "email": "user@example.com",
    "loginTime": "2025-08-30T10:00:00Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "options": {
    "priority": 1,
    "delay": 0,
    "attempts": 3
  }
}
```

### Execute Multiple Tasks (Batch)
```
POST /api/tasks/execute-batch
Content-Type: application/json

{
  "parallel": true,
  "tasks": [
    {
      "type": "user_login",
      "payload": { ... },
      "options": { ... }
    },
    {
      "type": "purchased",
      "payload": { ... }
    }
  ]
}
```

### Get Task Information
```
GET /api/tasks/info/:taskType
GET /api/tasks/info/user_login
```

### Get Available Task Types
```
GET /api/tasks/types
```

### Get All Tasks Information
```
GET /api/tasks/info
```

### Health Check
```
GET /api/tasks/health
```

## Usage Examples

### User Login Task
```typescript
const payload: UserLoginPayload = {
  userId: "user123",
  email: "user@example.com",
  loginTime: "2025-08-30T10:00:00Z",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// Using TaskService directly
await taskService.executeTask('user_login', payload);

// Using HTTP endpoint
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "user_login",
    "payload": {
      "userId": "user123",
      "email": "user@example.com",
      "loginTime": "2025-08-30T10:00:00Z",
      "ipAddress": "192.168.1.1"
    }
  }'
```

### Purchase Task
```typescript
const payload: PurchasedPayload = {
  userId: "user123",
  orderId: "order456",
  productId: "product789",
  amount: 99.99,
  currency: "USD",
  purchaseTime: "2025-08-30T10:00:00Z",
  paymentMethod: "credit_card"
};

await taskService.executeTask('purchased', payload);
```

### Message Sent Task
```typescript
const payload: MessageSentPayload = {
  messageId: "msg123",
  senderId: "user123",
  recipientId: "user456",
  messageType: "text",
  content: "Hello, how are you?",
  sentTime: "2025-08-30T10:00:00Z",
  channelId: "channel789"
};

await taskService.executeTask('message_sent', payload);
```

### Alert Triggered Task
```typescript
const payload: AlertTriggeredPayload = {
  alertId: "alert123",
  userId: "user123",
  alertType: "security",
  severity: "high",
  title: "Suspicious Login Attempt",
  message: "Login attempt from unknown location",
  triggeredTime: "2025-08-30T10:00:00Z",
  source: "auth-service",
  metadata: {
    attempts: 3,
    lastKnownIp: "192.168.1.100"
  }
};

await taskService.executeTask('alert_triggered', payload);
```

## Extending the System

### Adding a New Task Type

1. Create a new task class extending `AbstractTask`:

```typescript
import { Injectable } from '@nestjs/common';
import { AbstractTask, TaskPayload } from './abstract.task';

export interface CustomTaskPayload extends TaskPayload {
  customField: string;
  // Add your specific fields
}

@Injectable()
export class CustomTask extends AbstractTask {
  constructor() {
    super('custom_task', 'custom-queue');
  }

  async execute(payload: CustomTaskPayload): Promise<void> {
    // Implement your custom task logic
    console.log('Executing custom task', payload);
  }
}
```

2. Add the new task to the factory:

```typescript
// In task.factory.ts
export type TaskType = 'user_login' | 'purchased' | 'message_sent' | 'alert_triggered' | 'custom_task';

// Add to constructor and getTask method
```

3. Register in the module:

```typescript
// In task.module.ts
providers: [
  // ... existing providers
  CustomTask,
],
```

## Queue Integration

The current implementation includes a simulation of queue operations. To integrate with a real queue system (Redis, RabbitMQ, etc.), modify the `simulateQueueOperation` method in `AbstractTask`:

```typescript
private async simulateQueueOperation(payload: TaskPayload, options: TaskOptions): Promise<void> {
  // Replace with actual queue implementation
  await this.queueService.add(this.taskType, payload, {
    priority: options.priority,
    delay: options.delay,
    attempts: options.attempts,
  });
}
```

## Error Handling

The system includes comprehensive error handling:

- Task execution errors are caught and logged
- Invalid task types return appropriate HTTP errors
- Batch execution can continue on individual task failures
- All endpoints return structured error responses

## Testing

You can test the task system using the provided endpoints. Start the application and use curl or any HTTP client to interact with the API.

Example health check:
```bash
curl http://localhost:3000/api/tasks/health
```

Example task execution:
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "user_login",
    "payload": {
      "userId": "test123",
      "email": "test@example.com",
      "loginTime": "2025-08-30T10:00:00Z",
      "ipAddress": "127.0.0.1"
    }
  }'
```
