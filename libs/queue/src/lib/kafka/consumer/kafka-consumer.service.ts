import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';
import { ConsumerHandler, KafkaConsumerConfig, KafkaMessage } from '../interfaces';
import { getKafkaConsumerConfig } from '../utils';
import { ReplyTopicHandler } from '../handlers/reply-topic.handler';
import { KafkaTopics } from '../../constants';
import { KafkaConsumerRegistry } from './kafka-consumer-registry';
import { QueueInjectionTokens } from '../../constants/injection-tokens';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private handlers = new Map<string, ConsumerHandler>();
  private config: KafkaConsumerConfig;

  constructor(
    private readonly configService: ConfigService,
    @Inject(QueueInjectionTokens.REPLY_TOPIC_HANDLER)
    private readonly replyTopicHandler: ReplyTopicHandler,
    @Inject(QueueInjectionTokens.TASK_NOTIFICATION_HANDLER)
    private readonly notificationHandler: ConsumerHandler,
    @Inject(QueueInjectionTokens.KAFKA_CONSUMER_REGISTRY)
    private readonly kafkaConsumerRegistry: KafkaConsumerRegistry
  ) {
    this.config = getKafkaConsumerConfig(configService);
    this.kafka = new Kafka(this.config);
    this.consumer = this.kafka.consumer({
      groupId: this.config.groupId,
      sessionTimeout: this.config.sessionTimeout || 30000,
      heartbeatInterval: this.config.heartbeatInterval || 3000,
      rebalanceTimeout: this.config.rebalanceTimeout || 60000,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConnected = true;

      for (const topic of this.config.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      for (const [key, handler] of this.kafkaConsumerRegistry.KAFKA_TOPICS_HANDLERS) {
        this.registerHandler(key, handler);
      }
      
      await this.startConsuming();
      this.logger.log(`Kafka consumer connected and subscribed to topics: ${this.config.topics.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to initialize Kafka consumer', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.consumer.disconnect();
        this.isConnected = false;
        this.logger.log('Kafka consumer disconnected');
      } catch (error) {
        this.logger.error('Error disconnecting Kafka consumer', error);
      }
    }
  }

  private async startConsuming(): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const handler = this.handlers.get(topic);
          if (!handler) {
            this.logger.warn(`No handler registered for topic: ${topic}`);
            return;
          }

          const kafkaMessage: KafkaMessage = {
            topic,
            partition,
            offset: message.offset,
            key: message.key,
            value: this.parseMessageValue(message.value),
            timestamp: message.timestamp,
            headers: this.parseHeaders(message.headers),
          };

          await handler.handle(kafkaMessage);
          this.logger.debug(`Successfully processed message from topic ${topic}, offset ${message.offset}`);
        } catch (error) {
          this.logger.error(
            `Error processing message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
            error
          );
          // In a production environment, you might want to:
          // 1. Send to a dead letter queue
          // 2. Implement retry logic
          // 3. Alert monitoring systems
          throw error; // This will trigger the consumer's retry mechanism
        }
      },
    });
  }

  registerHandler(topic: string, handler: ConsumerHandler): void {
    if (this.handlers.has(topic)) {
      this.logger.warn(`Handler for topic ${topic} is being overridden`);
    }
    this.handlers.set(topic, handler);
    this.logger.log(`Handler registered for topic: ${topic}`);
  }

  unregisterHandler(topic: string): void {
    this.handlers.delete(topic);
    this.logger.log(`Handler unregistered for topic: ${topic}`);
  }

  private parseMessageValue(value: Buffer | null): unknown {
    if (!value) {
      return null;
    }

    try {
      const stringValue = value.toString('utf8');
      return JSON.parse(stringValue);
    } catch {
      // If it's not JSON, return as string
      return value.toString('utf8');
    }
  }

  private parseHeaders(headers: unknown): Record<string, string | Buffer> | undefined {
    if (!headers) {
      return undefined;
    }

    const parsedHeaders: Record<string, string | Buffer> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (Buffer.isBuffer(value)) {
        try {
          // Try to convert to string if it's valid UTF-8
          parsedHeaders[key] = value.toString('utf8');
        } catch {
          // Keep as Buffer if it's not valid UTF-8
          parsedHeaders[key] = value;
        }
      } else if (typeof value === 'string') {
        parsedHeaders[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        // Take the first value if it's an array
        const firstValue = value[0];
        if (Buffer.isBuffer(firstValue)) {
          try {
            parsedHeaders[key] = firstValue.toString('utf8');
          } catch {
            parsedHeaders[key] = firstValue;
          }
        } else if (typeof firstValue === 'string') {
          parsedHeaders[key] = firstValue;
        }
      }
    }
    return parsedHeaders;
  }

  isConsumerConnected(): boolean {
    return this.isConnected;
  }

  getRegisteredTopics(): string[] {
    return Array.from(this.handlers.keys());
  }

  // Manual commit for advanced use cases
  async commitOffsets(
    topicPartitions: Array<{
      topic: string;
      partition: number;
      offset: string;
    }>
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer is not connected');
    }

    try {
      await this.consumer.commitOffsets(topicPartitions);
      this.logger.debug(`Committed offsets for ${topicPartitions.length} topic-partitions`);
    } catch (error) {
      this.logger.error('Failed to commit offsets', error);
      throw error;
    }
  }

  // Pause consumption for specific topics
  async pauseTopics(topics: string[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer is not connected');
    }

    try {
      const topicPartitions = topics.map(topic => ({ topic }));
      this.consumer.pause(topicPartitions);
      this.logger.log(`Paused consumption for topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to pause topics', error);
      throw error;
    }
  }

  // Resume consumption for specific topics
  async resumeTopics(topics: string[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer is not connected');
    }

    try {
      const topicPartitions = topics.map(topic => ({ topic }));
      this.consumer.resume(topicPartitions);
      this.logger.log(`Resumed consumption for topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to resume topics', error);
      throw error;
    }
  }
}
