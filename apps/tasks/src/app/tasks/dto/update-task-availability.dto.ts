import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTaskAvailabilityDto {
  @ApiProperty({
    description: 'Whether the task should be available for execution',
    example: true
  })
  @IsBoolean()
  isAvailable!: boolean;
}
