# Kafka Message System with SSE Notifications

A comprehensive NestJS implementation providing Kafka message processing, Redis-synchronized pending requests management, and Server-Sent Events (SSE) for real-time notifications in a multi-pod Kubernetes environment.

## Features

### 🚀 Core Capabilities
- **Multi-topic Kafka Consumers** with automatic message routing
- **Reply Topic Handling** for request-response patterns
- **Redis Synchronization** for pending requests across multiple pods
- **Server-Sent Events (SSE)** for real-time client notifications
- **Health Monitoring** with automated metrics collection
- **Request-Response Pattern** with timeout and error handling
- **Batch Processing** for multiple tasks
- **Type-safe Contracts** for message validation

### 🔧 Production Ready
- **Error Handling** with retry logic and dead letter queues
- **Performance Optimization** with connection pooling and batching
- **Multi-pod Synchronization** via Redis Pub/Sub
- **Health Checks** and metrics collection
- **Graceful Shutdown** with cleanup procedures
- **SOLID Principles** implementation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Producer      │    │   Kafka Broker   │    │   Consumer      │
│   Service       │───▶│                  │───▶│   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       │                       ▼
┌─────────────────┐              │              ┌─────────────────┐
│   Redis Store   │◀─────────────┼──────────────▶│   Redis Pub/Sub │
│ (Pending Reqs)  │              │              │   (Responses)   │
└─────────────────┘              │              └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   SSE Clients   │
                         │  (Real-time)    │
                         └─────────────────┘
```

## Installation

### Prerequisites
- Node.js 18+
- Kafka 2.8+
- Redis 6+
- Docker (optional)

### Dependencies
```bash
npm install kafkajs ioredis @nestjs/microservices @nestjs/schedule
```

## Configuration

### Environment Variables
```env
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=message-system-service
KAFKA_GROUP_ID=message-system-group

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application
PORT=3000
NODE_ENV=development
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Usage

### Basic Implementation

#### 1. Import the Queue Module
```typescript
import { Module } from '@nestjs/common';
import { QueueModule } from '@message-system/queue';

@Module({
  imports: [QueueModule],
  // ...
})
export class AppModule {}
```

#### 2. Inject Services
```typescript
import { Injectable } from '@nestjs/common';
import { 
  KafkaOrchestrator, 
  SSENotificationService,
  TaskContract,
  TaskResponseContract 
} from '@message-system/queue';

@Injectable()
export class MyService {
  constructor(
    private readonly kafkaOrchestrator: KafkaOrchestrator,
    private readonly sseService: SSENotificationService
  ) {}

  async sendTask(task: TaskContract): Promise<TaskResponseContract> {
    return this.kafkaOrchestrator.sendRequest(task.topic, { value: task });
  }
}
```

### Request-Response Pattern

```typescript
// Send a task and wait for response
const task: TaskContract = {
  id: 'task_123',
  topic: 'USER_LOGIN',
  startTime: Date.now() / 1000
};

const response = await kafkaOrchestrator.sendRequest<TaskResponseContract>(
  task.topic,
  { value: task },
  30000 // 30 second timeout
);

console.log('Task completed:', response);
```

### Fire-and-Forget Pattern

```typescript
// Send a message without waiting for response
await kafkaOrchestrator.sendMessage('USER_LOGIN', {
  value: {
    userId: '123',
    email: 'user@example.com',
    loginTime: new Date().toISOString()
  }
});
```

### Server-Sent Events (SSE)

#### Setup SSE Endpoint
```typescript
@Controller('events')
export class EventsController {
  constructor(private readonly sseService: SSENotificationService) {}

  @Sse('stream')
  subscribeToEvents(@Req() req, @Res() res, @Query('channels') channels?: string) {
    const clientId = randomUUID();
    
    // Create SSE connection
    const eventStream = this.sseService.createConnection(req, res, clientId);
    
    // Subscribe to channels
    if (channels) {
      const channelList = channels.split(',');
      this.sseService.subscribeToChannels(clientId, channelList);
    }
    
    return eventStream;
  }
}
```

#### Client-Side JavaScript
```javascript
const eventSource = new EventSource('/events/stream?channels=auth,payments');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

eventSource.addEventListener('task_completed', function(event) {
  const data = JSON.parse(event.data);
  console.log('Task completed:', data);
});
```

### Broadcasting Notifications

```typescript
// Broadcast to all clients on a channel
sseService.broadcast('alerts', {
  event: 'system_alert',
  data: {
    type: 'warning',
    message: 'System maintenance in 5 minutes',
    timestamp: new Date().toISOString()
  }
});
```

## API Endpoints

### Kafka Messaging
- `POST /kafka/send/:topic` - Send message to topic
- `POST /kafka/request/:topic` - Send request and wait for reply
- `GET /kafka/health` - Check system health

### SSE Management
- `GET /kafka/events` - Subscribe to SSE stream
- `POST /kafka/sse/subscribe/:clientId` - Subscribe to channels
- `GET /kafka/sse/clients` - Get connected clients
- `POST /kafka/sse/broadcast/:channel` - Broadcast message

### Task Execution
- `POST /executor/tasks/execute` - Execute single task
- `POST /executor/tasks/batch` - Execute multiple tasks
- `POST /executor/tasks/user-login` - Execute user login task
- `POST /executor/tasks/purchase` - Execute purchase task

### Health & Monitoring
- `GET /kafka/health` - Current health status
- `GET /kafka/health/metrics` - System metrics
- `GET /kafka/health/summary` - Health summary with trends

## Message Contracts

### Base Task Contract
```typescript
interface TaskContract {
  id: string;
  topic: string;
  startTime: number; // Unix timestamp in seconds
}
```

### Task Response Contract
```typescript
interface TaskResponseContract {
  id: string;
  topic: string;
  status: 'success' | 'error';
  error?: string;
  endTime: number; // Unix timestamp in seconds
}
```

## Error Handling

### Retry Configuration
```typescript
const kafkaConfig = {
  retry: {
    retries: 5,
    initialRetryTime: 300,
    multiplier: 2,
    maxRetryTime: 30000
  }
};
```

### Error Recovery
```typescript
try {
  const response = await kafkaOrchestrator.sendRequest(topic, request);
} catch (error) {
  if (error.message.includes('timeout')) {
    // Handle timeout
    console.log('Request timed out');
  } else {
    // Handle other errors
    console.error('Request failed:', error);
  }
}
```

## Multi-Pod Deployment

### Redis Synchronization
The system automatically synchronizes pending requests across multiple pods using Redis Pub/Sub:

1. **Request Storage**: Pending requests are stored in Redis with TTL
2. **Reply Broadcasting**: Responses are published to Redis channels
3. **Cross-Pod Resolution**: Any pod can resolve pending requests from other pods

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: message-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: message-system
  template:
    metadata:
      labels:
        app: message-system
    spec:
      containers:
      - name: message-system
        image: message-system:latest
        env:
        - name: KAFKA_BROKERS
          value: "kafka-service:9092"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: HOSTNAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
```

## Monitoring

### Health Checks
The system provides comprehensive health monitoring:

- **Kafka Connection Status**: Producer/consumer connectivity
- **Pending Requests**: Number of active pending requests
- **SSE Clients**: Connected client count
- **System Metrics**: Performance and reliability metrics

### Metrics Collection
Automated metrics collection every minute:
- Kafka producer/consumer status
- Pending request counts
- SSE client statistics
- Connection durations

## Performance Optimization

### Connection Pooling
- **Kafka**: Reuses producer/consumer connections
- **Redis**: Connection pooling with ioredis
- **SSE**: Efficient client management with heartbeat

### Batch Processing
```typescript
// Process multiple tasks efficiently
const tasks = [task1, task2, task3];
const results = await executorService.executeBatch(tasks);
```

### Memory Management
- **Map-based Storage**: Efficient pending request storage
- **TTL Management**: Automatic cleanup of expired requests
- **Client Cleanup**: Automatic removal of disconnected SSE clients

## Security Considerations

### Message Validation
```typescript
// Validate incoming messages
if (!message.value || typeof message.value !== 'object') {
  throw new Error('Invalid message format');
}
```

### Channel Authorization
```typescript
// Implement channel-based access control
const allowedChannels = getUserAllowedChannels(userId);
const requestedChannels = channels.filter(c => allowedChannels.includes(c));
```

## Troubleshooting

### Common Issues

1. **Kafka Connection Failed**
   - Check broker connectivity
   - Verify authentication credentials
   - Review firewall rules

2. **Redis Connection Issues**
   - Validate Redis URL format
   - Check Redis server status
   - Review memory usage

3. **SSE Client Disconnections**
   - Monitor heartbeat intervals
   - Check network stability
   - Review client-side error handling

### Debug Logging
```typescript
// Enable debug logging
const logger = new Logger('KafkaOrchestrator');
logger.debug('Processing message', { topic, partition, offset });
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the example implementations
