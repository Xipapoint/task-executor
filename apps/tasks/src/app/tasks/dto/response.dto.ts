import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../factories/task.factory';

export class BaseResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true
  })
  success!: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully'
  })
  message!: string;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2025-08-31T12:00:00.000Z'
  })
  timestamp!: string;
}

export class TaskExecutionResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Success message for task execution',
    example: 'Task user_login executed successfully'
  })
  message!: string;
}

export class BatchTaskExecutionResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Number of tasks executed',
    example: 3
  })
  executedTasks!: number;

  @ApiProperty({
    description: 'Execution mode used',
    enum: ['parallel', 'sequential'],
    example: 'parallel'
  })
  executionMode!: 'parallel' | 'sequential';
}

export class TaskInfoResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Task information data'
  })
  data!: {
    taskType: string;
    queueName: string;
  };
}

export class AvailableTaskTypesResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Available task types data'
  })
  data!: {
    taskTypes: TaskType[];
    count: number;
  };
}

export class AllTasksInfoResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'All tasks information'
  })
  data!: {
    tasks: Array<{
      taskType: TaskType;
      queueName: string;
    }>;
    count: number;
  };
}

export class HealthCheckResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Number of available task types',
    example: 4
  })
  availableTaskTypes!: number;
}

export class TaskStatusResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Task status data',
    required: false
  })
  data?: {
    isAvailable: boolean;
    [key: string]: unknown;
  };
}

export class CachedTasksResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Cached tasks data'
  })
  data!: Array<{
    isAvailable: boolean;
    [key: string]: unknown;
  }>;

  @ApiProperty({
    description: 'Number of cached tasks',
    example: 4
  })
  count!: number;
}
