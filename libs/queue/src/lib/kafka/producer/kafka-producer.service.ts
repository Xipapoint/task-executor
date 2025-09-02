import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { KafkaConfig, Producer, Kafka } from 'kafkajs';

export interface KafkaProducerConfig {
  clientId: string;
  brokers: string[];
  maxInFlightRequests?: number;
  retry?: {
    retries: number;
    initialRetryTime: number;
    multiplier: number;
    maxRetryTime: number;
  };
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain';
    username: string;
    password: string;
  } | {
    mechanism: 'scram-sha-256';
    username: string;
    password: string;
  } | {
    mechanism: 'scram-sha-512';
    username: string;
    password: string;
  };
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly config: KafkaProducerConfig) {
    const kafkaConfig: KafkaConfig = {
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      retry: this.config.retry || {
        retries: 5,
        initialRetryTime: 300,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    };

    if (this.config.ssl) {
      kafkaConfig.ssl = this.config.ssl;
    }

    if (this.config.sasl) {
      kafkaConfig.sasl = this.config.sasl;
    }

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      maxInFlightRequests: this.config.maxInFlightRequests || 5,
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
