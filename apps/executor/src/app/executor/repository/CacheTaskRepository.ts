import { RedisClient } from '@message-system/cache';
import { Injectable } from '@nestjs/common';
import { CACHE_TASK_PATTERN, getCacheTaskKey } from '../constants';
import { CacheTask } from '../interfaces/cache-task/cache-task';

@Injectable()
export class CacheTaskRepository {
  constructor(
    private readonly redisClient: RedisClient,
  ) {}
  async save(taskId: string, data: CacheTask): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await this.redisClient.set(taskId, JSON.stringify(data));
  }

  async setRecentlyUsed(taskId: string, expiration = 3600): Promise<void> {
    await this.redisClient.set(taskId, 'recently_used', expiration);
  }

  async getRecentlyUsedTasks(): Promise<CacheTask[]> {
    const keys = await this.redisClient.keys(CACHE_TASK_PATTERN.ALL_TASKS);
    const tasks: CacheTask[] = []
    await Promise.all(keys.map(async key => tasks.push(JSON.parse(await this.redisClient.get(key)))))
    return tasks
  }
}
