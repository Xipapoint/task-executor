import { Module } from '@nestjs/common';
import { RedisClient } from './redis.client';

@Module({
  controllers: [],
  providers: [RedisClient],
  exports: [RedisClient],
})
export class CacheModule {}
