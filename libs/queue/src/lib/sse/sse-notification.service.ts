import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Response } from 'express';

export interface SSEMessage {
  id?: string;
  event?: string;
  data: unknown;
  retry?: number;
}

export interface SSEClient {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  lastHeartbeat: number;
  response: Response;
}

@Injectable()
export class SSENotificationService implements OnModuleDestroy {
  private readonly logger = new Logger(SSENotificationService.name);
  private readonly clients = new Map<string, SSEClient>();
  private readonly messageSubject = new Subject<{ channel: string; message: SSEMessage }>();
  private heartbeatInterval: NodeJS.Timeout;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CLIENT_TIMEOUT = 60000; // 1 minute

  constructor() {
    this.startHeartbeat();
  }

  onModuleDestroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all client connections
    for (const client of this.clients.values()) {
      this.closeClient(client.id);
    }
    this.clients.clear();
    this.messageSubject.complete();
  }

  /**
   * Create SSE connection for a client
   */
  createConnection(
    req: { on: (event: string, callback: (...args: unknown[]) => void) => void }, 
    res: Response, 
    clientId: string, 
    userId?: string
  ): Observable<SSEMessage> {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Create client entry
    const client: SSEClient = {
      id: clientId,
      userId,
      subscriptions: new Set(),
      lastHeartbeat: Date.now(),
      response: res,
    };

    this.clients.set(clientId, client);
    this.logger.log(`SSE client connected: ${clientId}${userId ? ` (user: ${userId})` : ''}`);

    // Handle client disconnect
    req.on('close', () => {
      this.removeClient(clientId);
    });

    req.on('error', (error: Error) => {
      this.logger.error(`SSE client error for ${clientId}:`, error);
      this.removeClient(clientId);
    });

    // Send initial connection message
    this.sendToClient(clientId, {
      event: 'connected',
      data: { message: 'Connected to SSE stream', clientId, timestamp: new Date().toISOString() },
    });

    // Return observable for client-specific messages
    return this.messageSubject.pipe(
      filter(({ channel }) => {
        const client = this.clients.get(clientId);
        return client?.subscriptions.has(channel) || channel === 'system';
      }),
      map(({ message }) => message)
    );
  }

  /**
   * Subscribe client to specific channels
   */
  subscribeToChannels(clientId: string, channels: string[]): void {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn(`Attempt to subscribe non-existent client: ${clientId}`);
      return;
    }

    for (const channel of channels) {
      client.subscriptions.add(channel);
    }

    this.logger.debug(`Client ${clientId} subscribed to channels: ${channels.join(', ')}`);
    
    this.sendToClient(clientId, {
      event: 'subscription_updated',
      data: { 
        subscribedChannels: Array.from(client.subscriptions),
        timestamp: new Date().toISOString()
      },
    });
  }

  /**
   * Unsubscribe client from specific channels
   */
  unsubscribeFromChannels(clientId: string, channels: string[]): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    for (const channel of channels) {
      client.subscriptions.delete(channel);
    }

    this.logger.debug(`Client ${clientId} unsubscribed from channels: ${channels.join(', ')}`);
  }

  /**
   * Broadcast message to all clients subscribed to a channel
   */
  broadcast(channel: string, message: SSEMessage): void {
    const subscribedClients = Array.from(this.clients.values())
      .filter(client => client.subscriptions.has(channel));

    if (subscribedClients.length === 0) {
      this.logger.debug(`No clients subscribed to channel: ${channel}`);
      return;
    }

    this.logger.debug(`Broadcasting to ${subscribedClients.length} clients on channel: ${channel}`);

    for (const client of subscribedClients) {
      this.sendToClient(client.id, message);
    }

    // Also emit to the subject for reactive streams
    this.messageSubject.next({ channel, message });
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: SSEMessage): void {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn(`Attempt to send to non-existent client: ${clientId}`);
      return;
    }

    try {
      const sseData = this.formatSSEMessage(message);
      client.response.write(sseData);
      client.lastHeartbeat = Date.now();
      
      this.logger.debug(`Message sent to client ${clientId}`, { 
        event: message.event,
        dataSize: JSON.stringify(message.data).length 
      });
    } catch (error) {
      this.logger.error(`Error sending message to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  /**
   * Send heartbeat to all connected clients
   */
  sendHeartbeat(): void {
    const heartbeatMessage: SSEMessage = {
      event: 'heartbeat',
      data: { timestamp: new Date().toISOString() },
    };

    for (const client of this.clients.values()) {
      this.sendToClient(client.id, heartbeatMessage);
    }
  }

  /**
   * Get all connected clients info
   */
  getConnectedClients(): Array<{
    id: string;
    userId?: string;
    subscriptions: string[];
    lastHeartbeat: number;
    connectionDuration: number;
  }> {
    const now = Date.now();
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      userId: client.userId,
      subscriptions: Array.from(client.subscriptions),
      lastHeartbeat: client.lastHeartbeat,
      connectionDuration: now - client.lastHeartbeat,
    }));
  }

  /**
   * Get clients subscribed to a specific channel
   */
  getChannelSubscribers(channel: string): string[] {
    return Array.from(this.clients.values())
      .filter(client => client.subscriptions.has(channel))
      .map(client => client.id);
  }

  /**
   * Remove client and close connection
   */
  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.closeClient(clientId);
      this.clients.delete(clientId);
      this.logger.log(`SSE client disconnected: ${clientId}`);
    }
  }

  /**
   * Close client connection
   */
  private closeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client && client.response && !client.response.destroyed) {
      try {
        client.response.end();
      } catch (error) {
        this.logger.error(`Error closing client ${clientId}:`, error);
      }
    }
  }

  /**
   * Format message as SSE
   */
  private formatSSEMessage(message: SSEMessage): string {
    let formatted = '';
    
    if (message.id) {
      formatted += `id: ${message.id}\n`;
    }
    
    if (message.event) {
      formatted += `event: ${message.event}\n`;
    }
    
    if (message.retry) {
      formatted += `retry: ${message.retry}\n`;
    }

    // Handle data - can be string or object
    const data = typeof message.data === 'string' 
      ? message.data 
      : JSON.stringify(message.data);
    
    // Split data by lines for proper SSE format
    const dataLines = data.split('\n');
    for (const line of dataLines) {
      formatted += `data: ${line}\n`;
    }
    
    formatted += '\n'; // End message with empty line
    
    return formatted;
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
      this.cleanupStaleClients();
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Remove clients that haven't responded to heartbeat
   */
  private cleanupStaleClients(): void {
    const now = Date.now();
    const staleClients: string[] = [];

    for (const [clientId, client] of this.clients) {
      if (now - client.lastHeartbeat > this.CLIENT_TIMEOUT) {
        staleClients.push(clientId);
      }
    }

    for (const clientId of staleClients) {
      this.logger.warn(`Removing stale client: ${clientId}`);
      this.removeClient(clientId);
    }

    if (staleClients.length > 0) {
      this.logger.log(`Cleaned up ${staleClients.length} stale SSE clients`);
    }
  }
}
