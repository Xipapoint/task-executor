import { Controller, Get, Query, Logger, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { KafkaHealthService } from '../health/kafka-health.service';
import { MetricData, TrendData } from '../interfaces/metrics.interface';
import { QueueInjectionTokens } from '../constants/injection-tokens';

@ApiTags('kafka-health')
@Controller('kafka/health')
export class KafkaHealthController {
  private readonly logger = new Logger(KafkaHealthController.name);

  constructor(
    @Inject(QueueInjectionTokens.KAFKA_HEALTH_SERVICE)
    private readonly healthService: KafkaHealthService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Kafka system health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        lastCheck: { type: 'string' },
        details: {
          type: 'object',
          properties: {
            consumer: { type: 'boolean' },
            producer: { type: 'boolean' },
            pendingRequests: { type: 'number' },
            sseClients: { type: 'number' }
          }
        }
      }
    }
  })
  async getHealth() {
    return this.healthService.getHealthStatus();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics for monitoring' })
  @ApiQuery({ 
    name: 'hours', 
    required: false, 
    description: 'Number of hours of metrics to retrieve (default: 1)',
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System metrics data',
    schema: {
      type: 'object',
      properties: {
        timeRange: { type: 'string' },
        dataPoints: { type: 'number' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              kafka: {
                type: 'object',
                properties: {
                  consumer: { type: 'boolean' },
                  producer: { type: 'boolean' },
                  pendingRequests: { type: 'number' }
                }
              },
              sse: {
                type: 'object',
                properties: {
                  totalClients: { type: 'number' },
                  clientsByChannel: { type: 'object' },
                  averageConnectionDuration: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  })
  async getMetrics(@Query('hours') hours = 1) {
    const metrics = await this.healthService.getMetrics(hours);
    
    return {
      timeRange: `${hours} hour(s)`,
      dataPoints: metrics.length,
      metrics
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get health and metrics summary' })
  @ApiResponse({ 
    status: 200, 
    description: 'Combined health and metrics summary'
  })
  async getSummary() {
    const [health, recentMetrics] = await Promise.all([
      this.healthService.getHealthStatus(),
      this.healthService.getMetrics(0.5) // Last 30 minutes
    ]);

    const summary = {
      health,
      recentActivity: {
        dataPoints: recentMetrics.length,
        timeRange: '30 minutes',
        trends: this.calculateTrends(recentMetrics as MetricData[])
      }
    };

    return summary;
  }

  private calculateTrends(metrics: MetricData[]): TrendData {
    if (metrics.length < 2) {
      return {
        sseClients: 'insufficient_data',
        pendingRequests: 'insufficient_data',
        systemStability: 'insufficient_data'
      };
    }

    const latest = metrics[0];
    const oldest = metrics[metrics.length - 1];

    // Calculate trends
    const sseClientsTrend = latest.sse.totalClients - oldest.sse.totalClients;
    const pendingRequestsTrend = latest.kafka.pendingRequests - oldest.kafka.pendingRequests;
    
    // Calculate system stability (percentage of healthy checks)
    const healthyChecks = metrics.filter(m => 
      m.kafka.consumer && m.kafka.producer
    ).length;
    const stabilityPercentage = (healthyChecks / metrics.length) * 100;

    return {
      sseClients: {
        change: sseClientsTrend,
        direction: sseClientsTrend > 0 ? 'increasing' : 
                  sseClientsTrend < 0 ? 'decreasing' : 'stable'
      },
      pendingRequests: {
        change: pendingRequestsTrend,
        direction: pendingRequestsTrend > 0 ? 'increasing' : 
                  pendingRequestsTrend < 0 ? 'decreasing' : 'stable'
      },
      systemStability: {
        percentage: Math.round(stabilityPercentage),
        status: stabilityPercentage >= 95 ? 'excellent' :
                stabilityPercentage >= 85 ? 'good' :
                stabilityPercentage >= 70 ? 'fair' : 'poor'
      }
    };
  }
}
