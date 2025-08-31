import { Injectable } from '@nestjs/common';
import { AbstractTask, TaskPayload } from '../abstracts/abstract.task';

export interface MessageSentPayload extends TaskPayload {
  messageId: string;
  senderId: string;
  recipientId: string;
  messageType: 'text' | 'image' | 'video' | 'document';
  content: string;
  sentTime: string;
  channelId?: string;
}

@Injectable()
export class MessageSentTask extends AbstractTask {
  constructor() {
    super('message_sent', 'messaging-queue');
  }

  async execute(payload: MessageSentPayload): Promise<void> {
    console.log('Executing message sent task', {
      messageId: payload.messageId,
      senderId: payload.senderId,
      recipientId: payload.recipientId,
      messageType: payload.messageType,
      sentTime: payload.sentTime
    });

    // Implement message sent specific logic here
    // For example: update delivery status, trigger push notifications, log analytics, etc.
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log(`Message sent task completed for message ${payload.messageId}`);
  }
}
