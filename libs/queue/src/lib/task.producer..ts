import { Injectable } from '@nestjs/common';
import { ClientKafka, Client, Transport } from '@nestjs/microservices';
import { BaseTaskContract, BaseTaskResponseContract } from './contracts';

@Injectable()
export class TaskProducerService {
  @Client({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'task-producer',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'task-reply-consumer',
      },
    },
  })
  client: ClientKafka;

  async onModuleInit() {
    this.client.subscribeToResponseOf('task-reply');
    await this.client.connect();
  }

  emitTask<T extends BaseTaskContract>(task: T) {
    return this.client.emit(task.topic, task);
  }

  sendTaskAndWait<TResult extends BaseTaskResponseContract, TInput extends BaseTaskContract>(task: TInput) {
    return this.client.send<TResult, TInput>(task.topic, task);
  }

}
