import { Injectable } from '@nestjs/common';
import { AbstractTask, TaskPayload } from '../abstracts/abstract.task';
import axios from 'axios';
import { KafkaTopics } from '@message-system/queue';

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

    const result = axios.post(`https://localhost/api/kafka/send/${KafkaTopics.MESSAGE_SENT}`, {
      messageId: payload.messageId,
      status: 'sent',
      sentTime: payload.sentTime
    });

    console.log(result);

    console.log(`Message sent task completed for message ${payload.messageId}`);
  }
}
