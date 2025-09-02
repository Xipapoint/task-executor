import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { getKafkaProducerConfig } from '../utils/get-kafka-producer-config/get-kafka-producer-config';



@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const kafkaConfig = getKafkaProducerConfig(configService);

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      maxInFlightRequests: kafkaConfig.maxInFlightRequests || 5,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        this.logger.log('Kafka producer disconnected');
      } catch (error) {
        this.logger.error('Error disconnecting Kafka producer', error);
      }
    }
  }

  async sendMessage(
    topic: string,
    message: {
      key?: string;
      value: string | Buffer;
      headers?: Record<string, string | Buffer>;
      partition?: number;
    }
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    try {
      await this.producer.send({
        topic,
        messages: [message],
      });
      this.logger.debug(`Message sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}`, error);
      throw error;
    }
  }

  async sendMessages(
    topic: string,
    messages: Array<{
      key?: string;
      value: string | Buffer;
      headers?: Record<string, string | Buffer>;
      partition?: number;
    }>
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    try {
      await this.producer.send({
        topic,
        messages,
      });
      this.logger.debug(`${messages.length} messages sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send messages to topic ${topic}`, error);
      throw error;
    }
  }

  isProducerConnected(): boolean {
    return this.isConnected;
  }
}
