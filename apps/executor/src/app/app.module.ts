import { Module } from '@nestjs/common';
import { ExecutorModule } from './executor/executor.module';

@Module({
  imports: [ExecutorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
