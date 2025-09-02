import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RedisClient } from '@message-system/cache';
import { PendingRequest } from '../interfaces/kafka-consumer.interface';

@Injectable()
export class KafkaPendingRequestsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaPendingRequestsService.name);
  private readonly PENDING_REQUESTS_KEY = 'kafka:pending-requests';
  private readonly REPLY_CHANNEL = 'kafka:reply';
  private readonly REQUEST_TTL = 300; // 5 minutes
  
  private localPendingRequests = new Map<string, PendingRequest>();
  private replySubscriber: any;

  constructor(private readonly redisClient: RedisClient) {}

  async onModuleInit(): Promise<void> {
    await this.setupReplySubscription();
    this.logger.log('Kafka pending requests service initialized');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.replySubscriber) {
      await this.replySubscriber.unsubscribe();
    }
    
    // Clean up local pending requests
    for (const [requestId, request] of this.localPendingRequests) {
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
      request.reject(new Error('Service is shutting down'));
    }
    this.localPendingRequests.clear();
  }

  private async setupReplySubscription(): Promise<void> {
    try {
      const redis = this.redisClient.getClient();
      this.replySubscriber = redis.duplicate();
      
      await this.replySubscriber.subscribe(this.REPLY_CHANNEL);
      
      this.replySubscriber.on('message', async (channel: string, message: string) => {
        if (channel === this.REPLY_CHANNEL) {
          await this.handleReplyMessage(message);
        }
      });
      
      this.logger.log('Reply subscription setup completed');
    } catch (error) {
      this.logger.error('Failed to setup reply subscription', error);
      throw error;
    }
  }

  private async handleReplyMessage(message: string): Promise<void> {
    try {
      const reply = JSON.parse(message);
      const { requestId, response, error } = reply;

      // Check local pending requests first
      const localRequest = this.localPendingRequests.get(requestId);
      if (localRequest) {
        this.resolvePendingRequest(requestId, response, error);
        return;
      }

      // If not found locally, it might be for another pod
      this.logger.debug(`Reply for request ${requestId} not found in local pending requests`);
    } catch (error) {
      this.logger.error('Error handling reply message', error);
    }
  }

  async addPendingRequest(
    requestId: string,
    timeoutMs = 30000
  ): Promise<{ promise: Promise<unknown>; cleanup: () => void }> {
    const { promise, resolve, reject } = this.createDeferredPromise();
    
    const timeout = setTimeout(() => {
      this.rejectPendingRequest(requestId, new Error(`Request ${requestId} timed out`));
    }, timeoutMs);

    const pendingRequest: PendingRequest = {
      requestId,
      resolve,
      reject,
      timestamp: Date.now(),
      timeout,
    };

    // Store locally
    this.localPendingRequests.set(requestId, pendingRequest);
    
    // Store in Redis for cross-pod visibility
    try {
      await this.redisClient.set(
        `${this.PENDING_REQUESTS_KEY}:${requestId}`,
        JSON.stringify({
          requestId,
          timestamp: pendingRequest.timestamp,
          podId: process.env.HOSTNAME || 'unknown',
        }),
        this.REQUEST_TTL
      );
    } catch (error) {
      this.logger.error(`Failed to store pending request ${requestId} in Redis`, error);
    }

    const cleanup = () => {
      this.cleanupPendingRequest(requestId);
    };

    return { promise, cleanup };
  }

  async publishReply(requestId: string, response?: unknown, error?: string): Promise<void> {
    try {
      const replyMessage = JSON.stringify({
        requestId,
        response,
        error,
        timestamp: Date.now(),
      });

      const redis = this.redisClient.getClient();
      await redis.publish(this.REPLY_CHANNEL, replyMessage);
      
      this.logger.debug(`Published reply for request ${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to publish reply for request ${requestId}`, error);
    }
  }

  private resolvePendingRequest(requestId: string, response: unknown, error?: string): void {
    const pendingRequest = this.localPendingRequests.get(requestId);
    if (!pendingRequest) {
      return;
    }

    if (error) {
      pendingRequest.reject(new Error(error));
    } else {
      pendingRequest.resolve(response);
    }

    this.cleanupPendingRequest(requestId);
  }

  private rejectPendingRequest(requestId: string, error: Error): void {
    const pendingRequest = this.localPendingRequests.get(requestId);
    if (!pendingRequest) {
      return;
    }

    pendingRequest.reject(error);
    this.cleanupPendingRequest(requestId);
  }

  private async cleanupPendingRequest(requestId: string): Promise<void> {
    const pendingRequest = this.localPendingRequests.get(requestId);
    if (pendingRequest) {
      if (pendingRequest.timeout) {
        clearTimeout(pendingRequest.timeout);
      }
      this.localPendingRequests.delete(requestId);
    }

    // Remove from Redis
    try {
      await this.redisClient.del(`${this.PENDING_REQUESTS_KEY}:${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup pending request ${requestId} from Redis`, error);
    }
  }

  private createDeferredPromise(): {
    promise: Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  } {
    let resolve: (value: unknown) => void;
    let reject: (error: Error) => void;

    const promise = new Promise<unknown>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  }

  // Get metrics for monitoring
  getMetrics(): {
    localPendingCount: number;
    oldestPendingTimestamp?: number;
  } {
    const pendingRequests = Array.from(this.localPendingRequests.values());
    return {
      localPendingCount: pendingRequests.length,
      oldestPendingTimestamp: pendingRequests.length > 0 
        ? Math.min(...pendingRequests.map(r => r.timestamp))
        : undefined,
    };
  }
}
