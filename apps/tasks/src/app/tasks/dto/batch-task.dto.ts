import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExecuteTaskDto } from './execute-task.dto';

export class BatchTaskDto {
  @ApiProperty({
    description: 'Array of tasks to execute',
    type: [ExecuteTaskDto],
    example: [
      {
        taskType: 'user_login',
        payload: { userId: '12345', email: 'user@example.com' },
        options: { priority: 1 }
      },
      {
        taskType: 'message_sent',
        payload: { messageId: '67890', recipientId: '54321' },
        options: { delay: 1000 }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExecuteTaskDto)
  tasks!: ExecuteTaskDto[];

  @ApiProperty({
    description: 'Execute tasks in parallel or sequentially',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  parallel?: boolean;
}
