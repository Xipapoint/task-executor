import { Injectable } from '@nestjs/common';
import { AbstractTask, TaskPayload } from '../abstracts/abstract.task';
import axios from 'axios';
import { KafkaTopics } from '@message-system/queue';

export interface UserLoginPayload extends TaskPayload {
  userId: string;
  email: string;
  loginTime: string;
  ipAddress: string;
  userAgent?: string;
}

@Injectable()
export class UserLoginTask extends AbstractTask {
  constructor() {
    super('user_login', 'auth-queue');
  }

  async execute(payload: UserLoginPayload): Promise<void> {
    console.log('Executing user login task', {
      userId: payload.userId,
      email: payload.email,
      // loginTime: payload.loginTime,
      // ipAddress: payload.ipAddress
    });

    const result = await axios.post(`http://localhost:3001/api/kafka/send/${KafkaTopics.USER_LOGIN}`, {
      userId: payload.userId,
      email: payload.email,
      loginTime: payload.loginTime,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent
    });

    console.log(result);


    // Implement user login specific logic here
    // For example: update last login time, log security events, etc.
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`User login task completed for user ${payload.userId}`);
  }
}
