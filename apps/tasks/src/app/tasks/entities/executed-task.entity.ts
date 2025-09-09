import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { TASK_EXECTION_STATUS } from '../enum/TASK_EXECTION_STATUS';

@Entity('executed-tasks')
export class ExecutedTask {
    @ApiProperty({ description: 'Unique identifier for the executed task' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ 
        description: 'Status of the executed task',
        enum: TASK_EXECTION_STATUS,
        enumName: 'TASK_EXECTION_STATUS'
    })
    @Column({enum: TASK_EXECTION_STATUS, type: 'enum'})
    status: TASK_EXECTION_STATUS;

    @ApiProperty({ description: 'Username of the user who executed the task' })
    @Column()
    username: string;

    @ApiProperty({ description: 'Task execution time in milliseconds' })
    @Column({ name: 'task_execution_ms' })
    taskExecutionMs: number;
}