import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@message-system/queue';
import { CacheModule } from '@message-system/cache';

// Import the executor services and controllers
import { ExecutorService } from './executor.service';
import { ExecutorController } from './executor.controller';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    QueueModule, // This provides all Kafka services
    CacheModule,
  ],
  controllers: [ExecutorController, DemoController],
  providers: [ExecutorService, DemoService],
  exports: [ExecutorService, DemoService],
})
export class ExecutorModule {}
