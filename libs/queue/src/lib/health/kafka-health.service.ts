import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaOrchestrator } from '../kafka/kafka-orchestrator.service';
import { SSENotificationService } from '../sse/sse-notification.service';
import { RedisClient } from '@message-system/cache';
import { QueueInjectionTokens } from '../constants/injection-tokens';

@Injectable()
export class KafkaHealthService {
  private readonly logger = new Logger(KafkaHealthService.name);
  private readonly HEALTH_CHECK_KEY = 'kafka:health';
  private readonly METRICS_KEY = 'kafka:metrics';
  
  constructor(
    @Inject(QueueInjectionTokens.KAFKA_ORCHESTRATOR)
    private readonly kafkaOrchestrator: KafkaOrchestrator,
    @Inject(QueueInjectionTokens.SSE_NOTIFICATION_SERVICE)
    private readonly sseService: SSENotificationService,
    private readonly redisClient: RedisClient
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async performHealthCheck(): Promise<void> {
    try {
      const status = this.kafkaOrchestrator.getStatus();
      const isHealthy = this.kafkaOrchestrator.isHealthy();
      const timestamp = new Date().toISOString();

      const healthData = {
        healthy: isHealthy,
        timestamp,
        ...status
      };

      // Store health status in Redis
      await this.redisClient.set(
        this.HEALTH_CHECK_KEY,
        JSON.stringify(healthData),
        60 // TTL: 1 minute
      );

      // If unhealthy, broadcast alert to SSE clients
      if (!isHealthy) {
        this.sseService.broadcast('system', {
          event: 'health_alert',
          data: {
            type: 'kafka_unhealthy',
            message: 'Kafka system is unhealthy',
            details: status,
            timestamp
          }
        });
        
        this.logger.warn('Kafka system is unhealthy', status);
      }

    } catch (error) {
      this.logger.error('Health check failed', error);
      
      // Broadcast critical system error
      this.sseService.broadcast('system', {
        event: 'system_error',
        data: {
          type: 'health_check_failed',
          message: 'Health check system failure',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics(): Promise<void> {
    try {
      const status = this.kafkaOrchestrator.getStatus();
      const sseClients = this.sseService.getConnectedClients();
      
      const metrics = {
        timestamp: new Date().toISOString(),
        kafka: {
          consumer: status.consumer,
          producer: status.producer,
          pendingRequests: status.pendingRequests
        },
        sse: {
          totalClients: sseClients.length,
          clientsByChannel: this.getClientsByChannel(),
          averageConnectionDuration: this.getAverageConnectionDuration(sseClients)
        }
      };

      // Store metrics in Redis with 1-hour TTL
      await this.redisClient.set(
        `${this.METRICS_KEY}:${Date.now()}`,
        JSON.stringify(metrics),
        3600
      );

      // Keep only last 60 metrics entries (1 hour of data)
      await this.cleanupOldMetrics();

    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  async getHealthStatus(): Promise<{
    healthy: boolean;
    lastCheck: string;
    details: any;
  }> {
    try {
      const healthData = await this.redisClient.get(this.HEALTH_CHECK_KEY);
      if (healthData) {
        return JSON.parse(healthData);
      }
    } catch (error) {
      this.logger.error('Failed to get health status from Redis', error);
    }

    // Fallback to real-time check
    const status = this.kafkaOrchestrator.getStatus();
    return {
      healthy: this.kafkaOrchestrator.isHealthy(),
      lastCheck: new Date().toISOString(),
      details: status
    };
  }

  async getMetrics(hours = 1): Promise<any[]> {
    try {
      const pattern = `${this.METRICS_KEY}:*`;
      const keys = await this.redisClient.keys(pattern);
      
      // Sort keys by timestamp (newest first)
      const sortedKeys = keys.sort((a, b) => {
        const timestampA = parseInt(a.split(':').pop() || '0');
        const timestampB = parseInt(b.split(':').pop() || '0');
        return timestampB - timestampA;
      });

      // Get metrics for the requested time period
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      const relevantKeys = sortedKeys.filter(key => {
        const timestamp = parseInt(key.split(':').pop() || '0');
        return timestamp >= cutoffTime;
      });

      const metrics = [];
      for (const key of relevantKeys) {
        const data = await this.redisClient.get(key);
        if (data) {
          metrics.push(JSON.parse(data));
        }
      }

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get metrics', error);
      return [];
    }
  }

  private getClientsByChannel(): Record<string, number> {
    const channels = ['auth', 'payments', 'messages', 'alerts', 'general', 'system'];
    const clientsByChannel: Record<string, number> = {};
    
    for (const channel of channels) {
      const subscribers = this.sseService.getChannelSubscribers(channel);
      clientsByChannel[channel] = subscribers.length;
    }
    
    return clientsByChannel;
  }

  private getAverageConnectionDuration(clients: any[]): number {
    if (clients.length === 0) return 0;
    
    const totalDuration = clients.reduce((sum, client) => sum + client.connectionDuration, 0);
    return Math.round(totalDuration / clients.length);
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const pattern = `${this.METRICS_KEY}:*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length <= 60) return; // Keep 60 entries
      
      // Sort keys by timestamp and remove oldest
      const sortedKeys = keys.sort((a, b) => {
        const timestampA = parseInt(a.split(':').pop() || '0');
        const timestampB = parseInt(b.split(':').pop() || '0');
        return timestampA - timestampB;
      });
      
      const keysToDelete = sortedKeys.slice(0, keys.length - 60);
      for (const key of keysToDelete) {
        await this.redisClient.del(key);
      }
      
      this.logger.debug(`Cleaned up ${keysToDelete.length} old metric entries`);
    } catch (error) {
      this.logger.error('Failed to cleanup old metrics', error);
    }
  }
}
