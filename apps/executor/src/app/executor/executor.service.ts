import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { 
  KafkaOrchestrator, 
  SSENotificationService,
  KafkaTopics,
  TaskContract,
  TaskResponseContract
} from '@message-system/queue';

@Injectable()
export class ExecutorService implements OnModuleInit {
  private readonly logger = new Logger(ExecutorService.name);

  constructor(
    private readonly kafkaOrchestrator: KafkaOrchestrator,
    private readonly sseService: SSENotificationService
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Executor service initialized and ready to process tasks');
  }

  /**
   * Execute a task request with response tracking
   */
  async executeTask(taskData: TaskContract): Promise<TaskResponseContract> {
    const startTime = Date.now() / 1000;
    
    try {
      this.logger.log(`Executing task: ${taskData.topic}`, { id: taskData.id });

      // Send task request and wait for response
      const response = await this.kafkaOrchestrator.sendRequest<TaskResponseContract>(
        taskData.topic,
        { 
          value: taskData,
          key: taskData.id 
        },
        30000 // 30 second timeout
      );

      const endTime = Date.now() / 1000;
      
      // Enhance response with timing information
      const enhancedResponse: TaskResponseContract = {
        ...response,
        endTime
      };

      // Broadcast execution completion to SSE clients
      this.sseService.broadcast('tasks', {
        event: 'task_completed',
        data: {
          taskId: taskData.id,
          topic: taskData.topic,
          status: response.status,
          duration: endTime - startTime,
          timestamp: new Date().toISOString()
        }
      });

      this.logger.log(`Task execution completed: ${taskData.id}`, {
        status: response.status,
        duration: endTime - startTime
      });

      return enhancedResponse;
    } catch (error) {
      const endTime = Date.now() / 1000;
      
      this.logger.error(`Task execution failed: ${taskData.id}`, error);

      // Broadcast execution failure to SSE clients
      this.sseService.broadcast('tasks', {
        event: 'task_failed',
        data: {
          taskId: taskData.id,
          topic: taskData.topic,
          error: error.message,
          duration: endTime - startTime,
          timestamp: new Date().toISOString()
        }
      });

      // Return error response
      const errorResponse: TaskResponseContract = {
        id: taskData.id,
        topic: taskData.topic,
        status: 'error',
        error: error.message,
        endTime
      };

      return errorResponse;
    }
  }

  /**
   * Send fire-and-forget task (no response expected)
   */
  async sendTask(topic: string, taskData: unknown): Promise<void> {
    try {
      await this.kafkaOrchestrator.sendMessage(topic, {
        value: taskData,
        key: typeof taskData === 'object' && taskData && 'id' in taskData 
          ? String((taskData as { id: unknown }).id) 
          : undefined
      });

      this.logger.log(`Task sent to topic: ${topic}`);

      // Broadcast task submission to SSE clients
      this.sseService.broadcast('tasks', {
        event: 'task_sent',
        data: {
          topic,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send task to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Batch execute multiple tasks
   */
  async executeBatch(tasks: TaskContract[]): Promise<TaskResponseContract[]> {
    this.logger.log(`Executing batch of ${tasks.length} tasks`);

    // Broadcast batch start to SSE clients
    this.sseService.broadcast('tasks', {
      event: 'batch_started',
      data: {
        batchSize: tasks.length,
        taskIds: tasks.map(t => t.id),
        timestamp: new Date().toISOString()
      }
    });

    const results = await Promise.allSettled(
      tasks.map(task => this.executeTask(task))
    );

    const responses: TaskResponseContract[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
        if (result.value.status === 'success') {
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
        // Create error response for failed promises
        responses.push({
          id: 'unknown',
          topic: 'unknown',
          status: 'error',
          error: result.reason?.message || 'Unknown error',
          endTime: Date.now() / 1000
        });
      }
    }

    // Broadcast batch completion to SSE clients
    this.sseService.broadcast('tasks', {
      event: 'batch_completed',
      data: {
        batchSize: tasks.length,
        successCount,
        errorCount,
        timestamp: new Date().toISOString()
      }
    });

    this.logger.log(`Batch execution completed: ${successCount} successful, ${errorCount} failed`);

    return responses;
  }

  /**
   * Get system status
   */
  getStatus(): {
    healthy: boolean;
    kafka: {
      consumer: boolean;
      producer: boolean;
      pendingRequests: number;
      sseClients: number;
    };
    sseClients: number;
  } {
    const kafkaStatus = this.kafkaOrchestrator.getStatus();
    const sseClients = this.sseService.getConnectedClients();

    return {
      healthy: this.kafkaOrchestrator.isHealthy(),
      kafka: kafkaStatus,
      sseClients: sseClients.length
    };
  }

  /**
   * Send user login task (convenience method)
   */
  async sendUserLoginTask(payload: {
    userId: string;
    email: string;
    loginTime: string;
    ipAddress: string;
    userAgent?: string;
  }): Promise<TaskResponseContract> {
    const task: TaskContract = {
      id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: KafkaTopics.USER_LOGIN,
      startTime: Date.now() / 1000,
      ...payload
    };

    return this.executeTask(task);
  }

  /**
   * Send purchase task (convenience method)
   */
  async sendPurchaseTask(payload: {
    userId: string;
    orderId: string;
    productId: string;
    amount: number;
    currency: string;
    purchaseTime: string;
    paymentMethod: string;
  }): Promise<TaskResponseContract> {
    const task: TaskContract = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: KafkaTopics.PURCHASED,
      startTime: Date.now() / 1000,
      ...payload
    };

    return this.executeTask(task);
  }

  /**
   * Send alert task (convenience method)
   */
  async sendAlertTask(payload: {
    alertId: string;
    userId: string;
    alertType: 'security' | 'system' | 'business' | 'warning' | 'error';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    triggeredTime: string;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<TaskResponseContract> {
    const task: TaskContract = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: KafkaTopics.ALERT_TRIGGERED,
      startTime: Date.now() / 1000,
      ...payload
    };

    return this.executeTask(task);
  }
}
