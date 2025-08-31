import { Injectable } from '@nestjs/common';

export interface TaskPayload {
  [key: string]: unknown;
}

export interface TaskOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
}

@Injectable()
export abstract class AbstractTask {
  protected taskType: string;
  protected queueName: string;

  constructor(taskType: string, queueName = 'default') {
    this.taskType = taskType;
    this.queueName = queueName;
  }

  /**
   * Abstract method to be implemented by concrete task classes
   * This defines the specific logic for each task type
   */
  abstract execute(payload: TaskPayload): Promise<void>;

  /**
   * Handles the logic of sending task to consumer/queue
   * This is the common logic shared across all task types
   */
  async sendToConsumer(payload: TaskPayload, options: TaskOptions = {}): Promise<void> {
    try {
      // Log the task being sent
      console.log(`Sending task ${this.taskType} to queue ${this.queueName}`, {
        payload,
        options,
        timestamp: new Date().toISOString()
      });

      // Here you would integrate with your actual queue system (Redis, RabbitMQ, etc.)
      // For now, we'll simulate the queue operation
      await this.simulateQueueOperation();

      console.log(`Task ${this.taskType} successfully sent to consumer`);
    } catch (error) {
      console.error(`Failed to send task ${this.taskType} to consumer:`, error);
      throw error;
    }
  }

  /**
   * Simulates queue operation - replace with actual queue implementation
   */
  private async simulateQueueOperation(): Promise<void> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // You would replace this with actual queue logic like:
    // await this.queueService.add(this.taskType, payload, options);
    
    console.log('Queue operation completed');
  }

  /**
   * Process the task - combines execution and consumer sending
   */
  async process(payload: TaskPayload, options: TaskOptions = {}): Promise<void> {
    try {
      // Execute the task-specific logic
      await this.execute(payload);
      
      // Send to consumer for further processing if needed
      await this.sendToConsumer(payload, options);
    } catch (error) {
      console.error(`Task ${this.taskType} processing failed:`, error);
      throw error;
    }
  }

  /**
   * Get task metadata
   */
  getTaskInfo() {
    return {
      taskType: this.taskType,
      queueName: this.queueName
    };
  }
}
