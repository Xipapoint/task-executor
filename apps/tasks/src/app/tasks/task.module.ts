import { CacheModule } from '@message-system/cache';
import { NestjsModule } from '@message-system/nestjs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { TaskController } from './controllers/task.controller';
import { ExecutedTask } from './entities/executed-task.entity';
import { TaskFactory } from './factories/task.factory';
import { AlertTriggeredTask } from './implementations/alert-triggered.task';
import { MessageSentTask } from './implementations/message-sent.task';
import { PurchasedTask } from './implementations/purchased.task';
import { UserLoginTask } from './implementations/user-login.task';
import { INJECTION_TOKEN } from './injection-token/injection-token';
import { CacheTaskRepository } from './repository/CacheTaskRepository';
import { ExecutedTaskRepository } from './repository/executed-task.repository';
import { TaskService } from './services/task.service';
@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskFactory,
    CacheTaskRepository,
    ExecutedTaskRepository,
    {
      provide: INJECTION_TOKEN.USER_LOGIN,
      useClass: UserLoginTask,
    },
    {
      provide: INJECTION_TOKEN.PURCHASED,
      useClass: PurchasedTask,
    },
    {
      provide: INJECTION_TOKEN.MESSAGE_SENT,
      useClass: MessageSentTask,
    },
    {
      provide: INJECTION_TOKEN.ALERT_TRIGGERED,
      useClass: AlertTriggeredTask,
    },
  ],
  exports: [
    TaskService,
    TaskFactory,
    CacheTaskRepository,
    ExecutedTaskRepository,
  ],
  imports: [
    TypeOrmModule.forFeature([ExecutedTask]),
    CacheModule, 
    NestjsModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ]
})
export class TaskModule {}
