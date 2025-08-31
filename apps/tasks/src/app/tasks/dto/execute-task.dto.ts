import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType } from '../factories/task.factory';
import { TaskPayload, TaskOptions } from '../abstracts/abstract.task';

export class TaskOptionsDto implements TaskOptions {
  @ApiProperty({
    description: 'Task priority level',
    example: 1,
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  priority?: number;

  @ApiProperty({
    description: 'Delay before task execution in milliseconds',
    example: 5000,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  delay?: number;

  @ApiProperty({
    description: 'Number of attempts for task execution',
    example: 3,
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  attempts?: number;
}

export class ExecuteTaskDto {
  @ApiProperty({
    description: 'Type of task to execute',
    enum: ['user_login', 'purchased', 'message_sent', 'alert_triggered'],
    example: 'user_login'
  })
  @IsString()
  @IsIn(['user_login', 'purchased', 'message_sent', 'alert_triggered'])
  taskType!: TaskType;

  @ApiProperty({
    description: 'Task payload data',
    example: {
      userId: '12345',
      email: 'user@example.com',
      timestamp: '2025-08-31T12:00:00Z'
    }
  })
  @IsObject()
  payload!: TaskPayload;

  @ApiProperty({
    description: 'Task execution options',
    type: TaskOptionsDto,
    required: false
  })
  @IsOptional()
  @Type(() => TaskOptionsDto)
  options?: TaskOptionsDto;
}
