import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { message: string; service: string; timestamp: string } {
    return {
      message: 'User service is running',
      service: 'message-system-user',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
