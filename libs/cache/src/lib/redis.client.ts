import { Injectable, OnModuleDestroy, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, RedisOptions } from 'ioredis';

type KeyType = string; // Define KeyType if it's not globally available

@Injectable()
export class RedisClient implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisClient.name);

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
    const redisOptions: RedisOptions = {
      lazyConnect: true,
      enableAutoPipelining: true,
    };

    this.client = new Redis(redisUrl, redisOptions);

    this.client.on('error', (err) => {
      this.logger.error(`Redis Client Error: ${err.message}`, err.stack);
      // Depending on the error, you might want to re-throw,
      // or set a flag to indicate the client is unhealthy.
    });

    this.client.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });

    this.client.on('end', () => {
      this.logger.warn('Redis client connection ended');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis client is reconnecting...');
    });
  }

  // Use onModuleInit to establish the connection and catch initial connection errors
  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Redis client connected successfully during module initialization.');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error}`);
      // Depending on your application's requirements, you might want to:
      // 1. Throw a fatal error to prevent the application from starting if Redis is critical.
      // throw new InternalServerErrorException('Failed to connect to Redis');
      // 2. Log and continue, perhaps with degraded functionality.
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: KeyType, value: string | Buffer | number, ttl?: number): Promise<'OK'> {
    try {
      if (ttl) {
        return await this.client.set(key, value, 'EX', ttl);
      }
      return await this.client.set(key, value);
    } catch (error) {
      this.logger.error(`Error setting key "${key}" in Redis: ${error}`);
      throw new InternalServerErrorException(`Failed to set data in Redis for key: ${key}`);
    }
  }

  async get(key: KeyType): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key "${key}" from Redis: ${error}`);
      throw new InternalServerErrorException(`Failed to retrieve data from Redis for key: ${key}`);
    }
  }

  async del(key: KeyType): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key "${key}" from Redis: ${error}`);
      throw new InternalServerErrorException(`Failed to delete data from Redis for key: ${key}`);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys from Redis: ${error}`);
      throw new InternalServerErrorException(`Failed to retrieve keys from Redis`);
    }
  }

  async onModuleDestroy() {
    if (this.client.status === 'ready') { 
      await this.client.quit();
      this.logger.log('Redis client connection closed.');
    }
  }
}