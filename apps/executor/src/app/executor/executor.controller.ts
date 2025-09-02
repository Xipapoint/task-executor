import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ExecutorService } from './executor.service';
import { TaskContract } from '@message-system/queue';

@ApiTags('executor')
@Controller('executor')
export class ExecutorController {
  private readonly logger = new Logger(ExecutorController.name);

  constructor(private readonly executorService: ExecutorService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get executor service status' })
  @ApiResponse({ status: 200, description: 'Service status information' })
  getStatus() {
    return this.executorService.getStatus();
  }

  @Post('tasks/execute')
  @ApiOperation({ summary: 'Execute a single task and wait for response' })
  @ApiBody({
    description: 'Task to execute',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        topic: { type: 'string', description: 'Kafka topic' },
        startTime: { type: 'number', description: 'Start time in seconds' }
      },
      required: ['id', 'topic', 'startTime']
    }
  })
  @ApiResponse({ status: 200, description: 'Task execution result' })
  async executeTask(@Body() task: TaskContract) {
    return this.executorService.executeTask(task);
  }

  @Post('tasks/send/:topic')
  @ApiOperation({ summary: 'Send a fire-and-forget task' })
  @ApiParam({ name: 'topic', description: 'Kafka topic name' })
  @ApiBody({
    description: 'Task data',
    schema: {
      type: 'object',
      description: 'Task payload data'
    }
  })
  @ApiResponse({ status: 201, description: 'Task sent successfully' })
  async sendTask(
    @Param('topic') topic: string,
    @Body() taskData: unknown
  ) {
    await this.executorService.sendTask(topic, taskData);
    return {
      success: true,
      message: `Task sent to topic: ${topic}`,
      timestamp: new Date().toISOString()
    };
  }

  @Post('tasks/batch')
  @ApiOperation({ summary: 'Execute multiple tasks in batch' })
  @ApiBody({
    description: 'Array of tasks to execute',
    schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              topic: { type: 'string' },
              startTime: { type: 'number' }
            },
            required: ['id', 'topic', 'startTime']
          }
        }
      },
      required: ['tasks']
    }
  })
  @ApiResponse({ status: 200, description: 'Batch execution results' })
  async executeBatch(@Body() body: { tasks: TaskContract[] }) {
    const results = await this.executorService.executeBatch(body.tasks);
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return {
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      },
      results,
      timestamp: new Date().toISOString()
    };
  }

  // Convenience endpoints for specific task types
  @Post('tasks/user-login')
  @ApiOperation({ summary: 'Execute user login task' })
  @ApiBody({
    description: 'User login data',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
        loginTime: { type: 'string' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' }
      },
      required: ['userId', 'email', 'loginTime', 'ipAddress']
    }
  })
  @ApiResponse({ status: 200, description: 'User login task result' })
  async executeUserLoginTask(@Body() payload: {
    userId: string;
    email: string;
    loginTime: string;
    ipAddress: string;
    userAgent?: string;
  }) {
    return this.executorService.sendUserLoginTask(payload);
  }

  @Post('tasks/purchase')
  @ApiOperation({ summary: 'Execute purchase task' })
  @ApiBody({
    description: 'Purchase data',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        orderId: { type: 'string' },
        productId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        purchaseTime: { type: 'string' },
        paymentMethod: { type: 'string' }
      },
      required: ['userId', 'orderId', 'productId', 'amount', 'currency', 'purchaseTime', 'paymentMethod']
    }
  })
  @ApiResponse({ status: 200, description: 'Purchase task result' })
  async executePurchaseTask(@Body() payload: {
    userId: string;
    orderId: string;
    productId: string;
    amount: number;
    currency: string;
    purchaseTime: string;
    paymentMethod: string;
  }) {
    return this.executorService.sendPurchaseTask(payload);
  }

  @Post('tasks/alert')
  @ApiOperation({ summary: 'Execute alert task' })
  @ApiBody({
    description: 'Alert data',
    schema: {
      type: 'object',
      properties: {
        alertId: { type: 'string' },
        userId: { type: 'string' },
        alertType: { 
          type: 'string',
          enum: ['security', 'system', 'business', 'warning', 'error']
        },
        severity: { 
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical']
        },
        title: { type: 'string' },
        message: { type: 'string' },
        triggeredTime: { type: 'string' },
        source: { type: 'string' },
        metadata: { type: 'object' }
      },
      required: ['alertId', 'userId', 'alertType', 'severity', 'title', 'message', 'triggeredTime', 'source']
    }
  })
  @ApiResponse({ status: 200, description: 'Alert task result' })
  async executeAlertTask(@Body() payload: {
    alertId: string;
    userId: string;
    alertType: 'security' | 'system' | 'business' | 'warning' | 'error';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    triggeredTime: string;
    source: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.executorService.sendAlertTask(payload);
  }
}
