import { Module } from '@nestjs/common';
import { TaskModule } from './tasks/task.module';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { QueueModule } from '@message-system/queue';

@Module({
  imports: [
    TaskModule,
    ConfigModule.forRoot({ isGlobal: true }),
    QueueModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
