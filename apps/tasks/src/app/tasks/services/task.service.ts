import { Injectable, BadRequestException } from '@nestjs/common';
import { TaskFactory, TaskType } from '../factories/task.factory';
import { TaskPayload, TaskOptions } from '../abstracts/abstract.task';
import { CacheTaskRepository } from '../repository/CacheTaskRepository';
import { CacheTask } from '../interfaces/cache-task/cache-task';
import { ExecuteTaskDto } from '../dto/execute-task.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskFactory: TaskFactory,
    private readonly cacheTaskRepository: CacheTaskRepository
  ) {}

  async executeTask(taskType: TaskType, payload: TaskPayload, options: TaskOptions = {}): Promise<void> {
    try {
      if (!(await this.taskFactory.isTaskTypeSupported(taskType))) {
        throw new BadRequestException(`Unsupported task type: ${taskType}`);
      }

      const task = await this.taskFactory.getTask(taskType);
      await task.process(payload, options);
    } catch (error) {
      console.error(`Failed to execute task ${taskType}:`, error);
      throw error;
    }
  }

  async executeTasksBatch(tasks: ExecuteTaskDto[]): Promise<void> {
    try {
      const taskPromises = tasks.map(({ taskType, payload, options = {} }) => 
        this.executeTask(taskType, payload, options)
      );

      await Promise.all(taskPromises);
    } catch (error) {
      console.error('Failed to execute batch tasks:', error);
      throw error;
    }
  }

  async executeTasksSequential(tasks: ExecuteTaskDto[]): Promise<void> {
    try {
      for (const { taskType, payload, options = {} } of tasks) {
        await this.executeTask(taskType, payload, options);
      }
    } catch (error) {
      console.error('Failed to execute sequential tasks:', error);
      throw error;
    }
  }

  async getTaskInfo(taskType: TaskType) {
    if (!(await this.taskFactory.isTaskTypeSupported(taskType))) {
      throw new BadRequestException(`Unsupported task type: ${taskType}`);
    }

    const task = await this.taskFactory.getTask(taskType);
    return task.getTaskInfo();
  }

  async getAvailableTaskTypes(): Promise<TaskType[]> {
    return this.taskFactory.getAvailableTaskTypes();
  }

  async getAllTasksInfo() {
    const availableTypes = await this.getAvailableTaskTypes();
    const tasksInfo = [];
    
    for (const taskType of availableTypes) {
      const taskInfo = await this.getTaskInfo(taskType);
      tasksInfo.push({
        taskType,
        ...taskInfo
      });
    }
    
    return tasksInfo;
  }

  async updateTaskAvailability(taskType: string, isAvailable: boolean): Promise<void> {
    await this.cacheTaskRepository.updateTaskAvailability(taskType, isAvailable);
  }

  async getTaskStatus(taskType: string): Promise<boolean> {
    return (await this.cacheTaskRepository.find(`task:${taskType}`)).isAvailable;
  }

  async getAllTasks(): Promise<CacheTask[]> {
    return this.cacheTaskRepository.getAllTasks();
  }

  async getAvailableTasks(): Promise<CacheTask[]> {
    return this.cacheTaskRepository.getAvailableTasks();
  }
}
