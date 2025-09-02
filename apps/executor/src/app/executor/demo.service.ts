import { Injectable, Logger } from '@nestjs/common';
import { 
  KafkaOrchestrator,
  SSENotificationService,
  KafkaTopics,
  TaskContract,
  TaskResponseContract
} from '@message-system/queue';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly kafkaOrchestrator: KafkaOrchestrator,
    private readonly sseService: SSENotificationService
  ) {}

  /**
   * Demo: Send a user login task and wait for response
   */
  async demoUserLogin(): Promise<void> {
    this.logger.log('🚀 Demo: User Login Task');

    const loginTask: TaskContract = {
      id: `demo_login_${Date.now()}`,
      topic: KafkaTopics.USER_LOGIN,
      startTime: Date.now() / 1000
    };

    // Add user login data to the task
    const taskWithPayload = {
      ...loginTask,
      userId: 'demo_user_123',
      email: 'demo@example.com',
      loginTime: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      userAgent: 'Demo-Client/1.0'
    };

    try {
      // Send task and wait for response
      const response = await this.kafkaOrchestrator.sendRequest<TaskResponseContract>(
        loginTask.topic,
        { 
          value: taskWithPayload,
          key: loginTask.id 
        },
        30000 // 30 second timeout
      );

      this.logger.log('✅ Login task completed:', {
        taskId: response.id,
        status: response.status,
        duration: response.endTime - loginTask.startTime
      });

      // Broadcast success to SSE clients
      this.sseService.broadcast('demo', {
        event: 'demo_completed',
        data: {
          type: 'user_login',
          taskId: loginTask.id,
          status: 'success',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error('❌ Login task failed:', error);
      
      // Broadcast failure to SSE clients
      this.sseService.broadcast('demo', {
        event: 'demo_failed',
        data: {
          type: 'user_login',
          taskId: loginTask.id,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Demo: Fire-and-forget message
   */
  async demoFireAndForget(): Promise<void> {
    this.logger.log('🚀 Demo: Fire and Forget Message');

    const message = {
      userId: 'demo_user_456',
      event: 'page_view',
      page: '/dashboard',
      timestamp: new Date().toISOString()
    };

    try {
      await this.kafkaOrchestrator.sendMessage('analytics', {
        value: message,
        key: message.userId
      });

      this.logger.log('✅ Fire-and-forget message sent');

      // Notify SSE clients
      this.sseService.broadcast('demo', {
        event: 'message_sent',
        data: {
          type: 'analytics',
          message: 'Analytics event sent',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error('❌ Fire-and-forget failed:', error);
    }
  }

  /**
   * Demo: Batch processing
   */
  async demoBatchProcessing(): Promise<void> {
    this.logger.log('🚀 Demo: Batch Processing');

    const tasks: TaskContract[] = [
      {
        id: `batch_1_${Date.now()}`,
        topic: KafkaTopics.USER_LOGIN,
        startTime: Date.now() / 1000,
        userId: 'user_1',
        email: 'user1@example.com',
        loginTime: new Date().toISOString(),
        ipAddress: '192.168.1.101'
      },
      {
        id: `batch_2_${Date.now()}`,
        topic: KafkaTopics.PURCHASED,
        startTime: Date.now() / 1000,
        userId: 'user_2',
        orderId: 'order_123',
        productId: 'product_456',
        amount: 99.99,
        currency: 'USD',
        purchaseTime: new Date().toISOString(),
        paymentMethod: 'credit_card'
      },
      {
        id: `batch_3_${Date.now()}`,
        topic: KafkaTopics.ALERT_TRIGGERED,
        startTime: Date.now() / 1000,
        alertId: 'alert_789',
        userId: 'user_3',
        alertType: 'security',
        severity: 'high',
        title: 'Suspicious Login Attempt',
        message: 'Login from unusual location detected',
        triggeredTime: new Date().toISOString(),
        source: 'security_monitor'
      }
    ];

    // Broadcast batch start
    this.sseService.broadcast('demo', {
      event: 'batch_started',
      data: {
        batchSize: tasks.length,
        taskIds: tasks.map(t => t.id),
        timestamp: new Date().toISOString()
      }
    });

    const results = await Promise.allSettled(
      tasks.map(task => this.kafkaOrchestrator.sendRequest(
        task.topic,
        { value: task, key: task.id },
        30000
      ))
    );

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
        this.logger.log(`✅ Batch task ${index + 1} completed:`, {
          taskId: tasks[index].id,
          status: 'success'
        });
      } else {
        failureCount++;
        this.logger.error(`❌ Batch task ${index + 1} failed:`, {
          taskId: tasks[index].id,
          error: result.reason?.message
        });
      }
    });

    this.logger.log(`📊 Batch processing completed: ${successCount} success, ${failureCount} failed`);

    // Broadcast batch completion
    this.sseService.broadcast('demo', {
      event: 'batch_completed',
      data: {
        batchSize: tasks.length,
        successCount,
        failureCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Demo: SSE broadcasting
   */
  async demoSSEBroadcast(): Promise<void> {
    this.logger.log('🚀 Demo: SSE Broadcasting');

    const channels = ['auth', 'payments', 'alerts', 'demo'];
    
    for (const channel of channels) {
      const message = {
        event: 'demo_broadcast',
        data: {
          channel,
          message: `Hello from ${channel} channel!`,
          timestamp: new Date().toISOString(),
          random: Math.random()
        }
      };

      this.sseService.broadcast(channel, message);
      this.logger.log(`📡 Broadcasted to ${channel} channel`);
      
      // Wait a bit between broadcasts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Demo: System status monitoring
   */
  getSystemStatus(): {
    kafka: {
      consumer: boolean;
      producer: boolean;
      pendingRequests: number;
      sseClients: number;
    };
    sseClients: number;
    timestamp: string;
  } {
    const kafkaStatus = this.kafkaOrchestrator.getStatus();
    const sseClients = this.sseService.getConnectedClients();

    return {
      kafka: kafkaStatus,
      sseClients: sseClients.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run all demos sequentially
   */
  async runAllDemos(): Promise<void> {
    this.logger.log('🎯 Starting Complete Demo Sequence');

    try {
      // 1. System status
      this.logger.log('📊 System Status:', this.getSystemStatus());

      // 2. Fire and forget
      await this.demoFireAndForget();
      await this.sleep(2000);

      // 3. User login
      await this.demoUserLogin();
      await this.sleep(2000);

      // 4. SSE broadcasting
      await this.demoSSEBroadcast();
      await this.sleep(2000);

      // 5. Batch processing
      await this.demoBatchProcessing();

      this.logger.log('🎉 All demos completed successfully!');
      
      // Final status broadcast
      this.sseService.broadcast('demo', {
        event: 'demo_sequence_completed',
        data: {
          message: 'All demos completed successfully!',
          timestamp: new Date().toISOString(),
          systemStatus: this.getSystemStatus()
        }
      });

    } catch (error) {
      this.logger.error('❌ Demo sequence failed:', error);
      
      this.sseService.broadcast('demo', {
        event: 'demo_sequence_failed',
        data: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
