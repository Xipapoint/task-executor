import { Module } from '@nestjs/common';
import { TaskModule } from './tasks/task.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueModule } from '@message-system/queue';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutedTask } from './tasks/entities/executed-task.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432')),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'message_system_tasks'),
        entities: [ExecutedTask],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TaskModule,
    QueueModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
