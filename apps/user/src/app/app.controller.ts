import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  getStatus(): { message: string; service: string; timestamp: string } {
    return this.appService.getStatus();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): any {
    return this.appService.getHealth();
  }

  @Post('notify')
  @ApiOperation({ summary: 'Send notification via SSE' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        type: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Notification sent' })
  async sendNotification(@Body() body: { message: string; type?: string }): Promise<{ success: boolean }> {
    await this.appService.sendNotification(body);
    return { success: true };
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish message to Kafka' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        payload: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Message published' })
  async publishMessage(@Body() body: { topic: string; payload: any }): Promise<{ success: boolean }> {
    await this.appService.publishMessage(body.topic, body.payload);
    return { success: true };
  }
}
