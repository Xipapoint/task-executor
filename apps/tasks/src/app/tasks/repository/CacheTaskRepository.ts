import { RedisClient } from '@message-system/cache';
import { TaskFactory } from '../factories/task.factory';
import { OnModuleInit, Injectable } from '@nestjs/common';
import { CacheTask } from '../interfaces/cache-task/cache-task';
import { getCacheTaskKey } from '../constants/cache-task-pattern/cache-task-pattern';

@Injectable()
export class CacheTaskRepository implements OnModuleInit {
  constructor(
    private readonly redisClient: RedisClient,
    private readonly taskFactory: TaskFactory
  ) {}

  async onModuleInit() {
    // Устанавливаем связь с TaskFactory
    this.taskFactory.setCacheRepository(this);
    
    // Инициализируем все задачи как доступные
    const tasks = this.taskFactory.getAllTaskTypes();
    for (const taskType of tasks) {
      const cacheKey = getCacheTaskKey(taskType);
      const existingTask = await this.redisClient.get(cacheKey);
      
      if (!existingTask) {
        const cacheTask: CacheTask = {
          id: `task_${taskType}_${Date.now()}`,
          name: taskType,
          isAvailable: true,
          taskType,
          queueName: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await this.redisClient.set(cacheKey, JSON.stringify(cacheTask));
      }
    }
  }

  async save(taskId: string, data: CacheTask): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await this.redisClient.set(taskId, JSON.stringify(data));
  }

  async find(taskId: string): Promise<CacheTask | undefined> {
    const data = await this.redisClient.get(taskId);
    return data ? JSON.parse(data) : undefined;
  }

  async getAvailableTasks(): Promise<CacheTask[]> {
    const tasks = this.taskFactory.getAllTaskTypes();
    const availableTasks: CacheTask[] = [];

    for (const taskType of tasks) {
      const cacheTask = await this.find(getCacheTaskKey(taskType));
      if (cacheTask && cacheTask.isAvailable) {
        availableTasks.push(cacheTask);
      }
    }

    return availableTasks;
  }

  async getAllTasks(): Promise<CacheTask[]> {
    const tasks = this.taskFactory.getAllTaskTypes();
    const allTasks: CacheTask[] = [];

    for (const taskType of tasks) {
      const cacheTask = await this.find(getCacheTaskKey(taskType));
      if (cacheTask) {
        allTasks.push(cacheTask);
      }
    }

    return allTasks;
  }

  async updateTaskAvailability(taskType: string, isAvailable: boolean): Promise<void> {
    const cacheKey = getCacheTaskKey(taskType);
    const existingTask = await this.find(cacheKey);
    
    if (existingTask) {
      existingTask.isAvailable = isAvailable;
      await this.save(cacheKey, existingTask);
    } else {
      throw new Error(`Task ${taskType} not found in cache`);
    }
  }

  async delete(taskId: string): Promise<void> {
    await this.redisClient.del(taskId);
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
