import { Controller, Get, Post, Body, Param, Query, Res, Req, Sse, Logger, Inject } from '@nestjs/common';
import { Response, Request } from 'express';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { KafkaOrchestrator } from '../kafka/kafka-orchestrator.service';
import { SSENotificationService, SSEMessage } from '../sse/sse-notification.service';
import { randomUUID } from 'crypto';
import { KafkaTopics } from '../constants';
import { QueueInjectionTokens } from '../constants/injection-tokens';

@ApiTags('kafka-messaging')
@Controller('kafka')
export class KafkaMessagingController {
  private readonly logger = new Logger(KafkaMessagingController.name);

  constructor(
    @Inject(QueueInjectionTokens.KAFKA_ORCHESTRATOR)
    private readonly kafkaOrchestrator: KafkaOrchestrator,
    @Inject(QueueInjectionTokens.SSE_NOTIFICATION_SERVICE)
    private readonly sseService: SSENotificationService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Kafka system health' })
  @ApiResponse({ status: 200, description: 'System health status' })
  getHealth() {
    const status = this.kafkaOrchestrator.getStatus();
    const isHealthy = this.kafkaOrchestrator.isHealthy();

    return {
      healthy: isHealthy,
      timestamp: new Date().toISOString(),
      details: status
    };
  }

  @Post('send/:topic')
  @ApiOperation({ summary: 'Send message to Kafka topic' })
  @ApiParam({ name: 'topic', description: 'Kafka topic name' })
  @ApiBody({
    description: 'Message payload',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Message key (optional)' },
        value: { description: 'Message value (any type)' },
        headers: { 
          type: 'object', 
          description: 'Message headers (optional)',
          additionalProperties: { type: 'string' }
        }
      },
      required: ['value']
    }
  })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async sendMessage(
    @Param('topic') topic: string,
    @Body() body: {
      key?: string;
      value: unknown;
      headers?: Record<string, string>;
    }
  ) {
    try {
      await this.kafkaOrchestrator.sendMessage(topic, body);
      
      this.logger.log(`Message sent to topic: ${topic}`);
      
      return {
        success: true,
        message: `Message sent to topic ${topic}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}:`, error);
      throw error;
    }
  }

  @Post('request/:topic')
  @ApiOperation({ summary: 'Send request and wait for reply' })
  @ApiParam({ name: 'topic', description: 'Kafka topic name' })
  @ApiQuery({ 
    name: 'timeout', 
    required: false, 
    description: 'Request timeout in milliseconds (default: 30000)',
    type: 'number'
  })
  @ApiBody({
    description: 'Request payload',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Message key (optional)' },
        value: { description: 'Message value (any type)' },
        headers: { 
          type: 'object', 
          description: 'Message headers (optional)',
          additionalProperties: { type: 'string' }
        }
      },
      required: ['value']
    }
  })
  @ApiResponse({ status: 200, description: 'Request processed successfully' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async sendRequest(
    @Param('topic') topic: string,
    @Query('timeout') timeout = 30000,
    @Body() body: {
      key?: string;
      value: unknown;
      headers?: Record<string, string>;
    }
  ) {
    try {
      const response = await this.kafkaOrchestrator.sendRequest(
        topic,
        body,
        timeout
      );
      
      this.logger.log(`Request to topic ${topic} completed`);
      
      return {
        success: true,
        response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Request to topic ${topic} failed:`, error);
      throw error;
    }
  }

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to Server-Sent Events' })
  @ApiQuery({ 
    name: 'channels', 
    required: false, 
    description: 'Comma-separated list of channels to subscribe to',
    example: 'auth,payments,alerts'
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    description: 'User ID for personalized notifications'
  })
  @ApiResponse({ status: 200, description: 'SSE connection established' })
  subscribeToEvents(
    @Req() req: Request,
    @Res() res: Response,
    @Query('channels') channels?: string,
    @Query('userId') userId?: string
  ): Observable<SSEMessage> {
    const clientId = randomUUID();
    
    this.logger.log(`SSE client connecting: ${clientId}${userId ? ` (user: ${userId})` : ''}`);
    
    // Create SSE connection
    const eventStream = this.sseService.createConnection(req, res, clientId, userId);
    
    // Subscribe to requested channels
    if (channels) {
      const channelList = channels.split(',').map(c => c.trim()).filter(Boolean);
      if (channelList.length > 0) {
        this.sseService.subscribeToChannels(clientId, channelList);
      }
    } else {
      // Subscribe to all available channels by default
      this.sseService.subscribeToChannels(clientId, [
        'auth', 'payments', 'messages', 'alerts', 'general'
      ]);
    }
    
    return eventStream;
  }

  @Post('sse/subscribe/:clientId')
  @ApiOperation({ summary: 'Subscribe SSE client to additional channels' })
  @ApiParam({ name: 'clientId', description: 'SSE client ID' })
  @ApiBody({
    description: 'Channels to subscribe to',
    schema: {
      type: 'object',
      properties: {
        channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of channels to subscribe to'
        }
      },
      required: ['channels']
    }
  })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  subscribeToChannels(
    @Param('clientId') clientId: string,
    @Body() body: { channels: string[] }
  ) {
    this.sseService.subscribeToChannels(clientId, body.channels);
    
    return {
      success: true,
      message: `Subscribed to channels: ${body.channels.join(', ')}`,
      timestamp: new Date().toISOString()
    };
  }

  @Post('sse/unsubscribe/:clientId')
  @ApiOperation({ summary: 'Unsubscribe SSE client from channels' })
  @ApiParam({ name: 'clientId', description: 'SSE client ID' })
  @ApiBody({
    description: 'Channels to unsubscribe from',
    schema: {
      type: 'object',
      properties: {
        channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of channels to unsubscribe from'
        }
      },
      required: ['channels']
    }
  })
  @ApiResponse({ status: 200, description: 'Unsubscription completed' })
  unsubscribeFromChannels(
    @Param('clientId') clientId: string,
    @Body() body: { channels: string[] }
  ) {
    this.sseService.unsubscribeFromChannels(clientId, body.channels);
    
    return {
      success: true,
      message: `Unsubscribed from channels: ${body.channels.join(', ')}`,
      timestamp: new Date().toISOString()
    };
  }

  @Get('sse/clients')
  @ApiOperation({ summary: 'Get connected SSE clients info' })
  @ApiResponse({ status: 200, description: 'Connected clients information' })
  getConnectedClients() {
    const clients = this.sseService.getConnectedClients();
    
    return {
      totalClients: clients.length,
      clients: clients.map(client => ({
        id: client.id,
        userId: client.userId,
        subscriptions: client.subscriptions,
        lastHeartbeat: new Date(client.lastHeartbeat).toISOString(),
        connectionDuration: client.connectionDuration
      })),
      timestamp: new Date().toISOString()
    };
  }

  @Get('sse/channels/:channel/subscribers')
  @ApiOperation({ summary: 'Get subscribers for a specific channel' })
  @ApiParam({ name: 'channel', description: 'Channel name' })
  @ApiResponse({ status: 200, description: 'Channel subscribers' })
  getChannelSubscribers(@Param('channel') channel: string) {
    const subscribers = this.sseService.getChannelSubscribers(channel);
    
    return {
      channel,
      subscriberCount: subscribers.length,
      subscribers,
      timestamp: new Date().toISOString()
    };
  }

  @Post('sse/broadcast/:channel')
  @ApiOperation({ summary: 'Broadcast message to SSE channel' })
  @ApiParam({ name: 'channel', description: 'Channel name' })
  @ApiBody({
    description: 'Message to broadcast',
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', description: 'Event name (optional)' },
        data: { description: 'Message data' },
        id: { type: 'string', description: 'Message ID (optional)' },
        retry: { type: 'number', description: 'Retry interval in ms (optional)' }
      },
      required: ['data']
    }
  })
  @ApiResponse({ status: 200, description: 'Message broadcasted' })
  broadcastToChannel(
    @Param('channel') channel: string,
    @Body() message: SSEMessage
  ) {
    this.sseService.broadcast(channel, message);
    
    const subscriberCount = this.sseService.getChannelSubscribers(channel).length;
    
    return {
      success: true,
      message: `Broadcasted to ${subscriberCount} subscribers on channel ${channel}`,
      channel,
      subscriberCount,
      timestamp: new Date().toISOString()
    };
  }

  // Convenience methods for common task types
  @Post('tasks/user-login')
  @ApiOperation({ summary: 'Send user login task' })
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
  async sendUserLoginTask(@Body() data: {
    userId: string;
    email: string;
    loginTime: string;
    ipAddress: string;
    userAgent?: string;
  }) {
    return this.sendMessage(KafkaTopics.USER_LOGIN, { value: data });
  }

  @Post('tasks/purchase')
  @ApiOperation({ summary: 'Send purchase task' })
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
  async sendPurchaseTask(@Body() data: {
    userId: string;
    orderId: string;
    productId: string;
    amount: number;
    currency: string;
    purchaseTime: string;
    paymentMethod: string;
  }) {
    return this.sendMessage(KafkaTopics.PURCHASED, { value: data });
  }
}
