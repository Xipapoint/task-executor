import { Injectable, Inject } from '@nestjs/common';
import { AbstractTask } from '../abstracts/abstract.task';
import { UserLoginTask } from '../implementations/user-login.task';
import { PurchasedTask } from '../implementations/purchased.task';
import { MessageSentTask } from '../implementations/message-sent.task';
import { AlertTriggeredTask } from '../implementations/alert-triggered.task';
import { INJECTION_TOKEN } from '../injection-token/injection-token';

export type TaskType = 'user_login' | 'purchased' | 'message_sent' | 'alert_triggered';

interface ICacheTaskRepository {
  find(taskId: string): Promise<{ isAvailable: boolean } | undefined>;
}

@Injectable()
export class TaskFactory {
  private factory: Map<TaskType, AbstractTask>;
  private cacheTaskRepository?: ICacheTaskRepository;
  
  constructor(
    @Inject(INJECTION_TOKEN.USER_LOGIN) private readonly userLoginTask: UserLoginTask,
    @Inject(INJECTION_TOKEN.PURCHASED) private readonly purchasedTask: PurchasedTask,
    @Inject(INJECTION_TOKEN.MESSAGE_SENT) private readonly messageSentTask: MessageSentTask,
    @Inject(INJECTION_TOKEN.ALERT_TRIGGERED) private readonly alertTriggeredTask: AlertTriggeredTask
  ) {
    this.factory = new Map<TaskType, AbstractTask>([
      ['user_login', this.userLoginTask],
      ['purchased', this.purchasedTask],
      ['message_sent', this.messageSentTask],
      ['alert_triggered', this.alertTriggeredTask],
    ]);
  }

  setCacheRepository(repository: ICacheTaskRepository) {
    this.cacheTaskRepository = repository;
  }

  async getTask(taskType: TaskType): Promise<AbstractTask> {
    const cacheTask = await this.cacheTaskRepository?.find(`task:${taskType}`);
    
    if (cacheTask && !cacheTask.isAvailable) {
      throw new Error(`Task type ${taskType} is currently disabled`);
    }

    const task = this.factory.get(taskType);
    if (!task) {
      throw new Error(`Unknown task type: ${taskType}`);
    }
    return task;
  }

  async getAvailableTaskTypes(): Promise<TaskType[]> {
    const allTypes = Array.from(this.factory.keys());
    const availableTypes: TaskType[] = [];

    for (const taskType of allTypes) {
      const cacheTask = await this.cacheTaskRepository?.find(`task:${taskType}`);
      if (!cacheTask || cacheTask.isAvailable) {
        availableTypes.push(taskType);
      }
    }

    return availableTypes;
  }

  getAllTaskTypes(): TaskType[] {
    return Array.from(this.factory.keys());
  }

  async isTaskTypeSupported(taskType: string): Promise<boolean> {
    if (!this.factory.has(taskType as TaskType)) {
      return false;
    }

    const cacheTask = await this.cacheTaskRepository?.find(`task:${taskType}`);
    return !cacheTask || cacheTask.isAvailable;
  }
}
