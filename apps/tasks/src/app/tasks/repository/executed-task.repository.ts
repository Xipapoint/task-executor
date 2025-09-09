import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutedTask } from '../entities/executed-task.entity';
import { TASK_EXECTION_STATUS } from '../enum/TASK_EXECTION_STATUS';

@Injectable()
export class ExecutedTaskRepository {
  constructor(
    @InjectRepository(ExecutedTask)
    private readonly executedTaskRepository: Repository<ExecutedTask>,
  ) {}

  /**
   * Create and save a new executed task
   */
  async create(executedTaskData: Partial<ExecutedTask>): Promise<ExecutedTask> {
    const executedTask = this.executedTaskRepository.create(executedTaskData);
    return this.executedTaskRepository.save(executedTask);
  }

  /**
   * Find an executed task by ID
   */
  async findById(id: number): Promise<ExecutedTask | null> {
    return this.executedTaskRepository.findOne({ where: { id } });
  }

  /**
   * Find all executed tasks
   */
  async findAll(): Promise<ExecutedTask[]> {
    return this.executedTaskRepository.find();
  }

  /**
   * Find executed tasks by username
   */
  async findByUsername(username: string): Promise<ExecutedTask[]> {
    return this.executedTaskRepository.find({ 
      where: { username },
      order: { id: 'DESC' }
    });
  }

  /**
   * Find executed tasks by status
   */
  async findByStatus(status: TASK_EXECTION_STATUS): Promise<ExecutedTask[]> {
    return this.executedTaskRepository.find({ 
      where: { status },
      order: { id: 'DESC' }
    });
  }

  /**
   * Find executed tasks by username and status
   */
  async findByUsernameAndStatus(
    username: string, 
    status: TASK_EXECTION_STATUS
  ): Promise<ExecutedTask[]> {
    return this.executedTaskRepository.find({ 
      where: { username, status },
      order: { id: 'DESC' }
    });
  }

  /**
   * Update an executed task
   */
  async update(id: number, updateData: Partial<ExecutedTask>): Promise<ExecutedTask | null> {
    await this.executedTaskRepository.update(id, updateData);
    return this.findById(id);
  }

  /**
   * Delete an executed task by ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.executedTaskRepository.delete(id);
    return result.affected > 0;
  }

  /**
   * Count executed tasks by status
   */
  async countByStatus(status: TASK_EXECTION_STATUS): Promise<number> {
    return this.executedTaskRepository.count({ where: { status } });
  }

  /**
   * Count executed tasks by username
   */
  async countByUsername(username: string): Promise<number> {
    return this.executedTaskRepository.count({ where: { username } });
  }

  /**
   * Find executed tasks with execution time greater than specified milliseconds
   */
  async findByMinExecutionTime(minExecutionMs: number, order: 'DESC' | 'ASC' = 'DESC'): Promise<ExecutedTask[]> {
    return this.executedTaskRepository
        .createQueryBuilder('executed_task')
        .where('executed_task.task_execution_ms >= :minExecutionMs', {minExecutionMs})
        .orderBy('executed_task.task_execution_ms', order)
        .getMany()
  }

  /**
   * Find executed tasks with execution time between specified range
   */
  async findByExecutionTimeRange(
    minExecutionMs: number, 
    maxExecutionMs: number,
    order: 'DESC' | 'ASC' = 'DESC'
  ): Promise<ExecutedTask[]> {
    return this.executedTaskRepository
      .createQueryBuilder('executed_task')
        .where('executed_task.task_execution_ms BETWEEN :minExecutionMs AND :maxExecutionMs', {minExecutionMs, maxExecutionMs})
        .orderBy('executed_task.task_execution_ms', order)
        .getMany()
  }

  /**
   * Get average execution time for all tasks
   */
  async getAverageExecutionTime(): Promise<number> {
    const result: {average: string} = await this.executedTaskRepository
      .createQueryBuilder('executed_task')
      .select('AVG(executed_task.task_execution_ms)', 'average')
      .getRawOne();
    
    return parseFloat(result.average) || 0;
  }

  /**
   * Get average execution time by username
   */
  async getAverageExecutionTimeByUsername(username: string): Promise<number> {
    const result = await this.executedTaskRepository
      .createQueryBuilder('executed_task')
      .select('AVG(executed_task.task_execution_ms)', 'average')
      .where('executed_task.username = :username', { username })
      .getRawOne();
    
    return parseFloat(result.average) || 0;
  }

  /**
   * Get execution statistics by status
   */
  async getExecutionStatsByStatus(): Promise<Array<{
    status: TASK_EXECTION_STATUS;
    count: number;
    averageExecutionTime: number;
  }>> {
    const result = await this.executedTaskRepository
      .createQueryBuilder('executed_task')
      .select([
        'executed_task.status as status',
        'COUNT(*) as count',
        'AVG(executed_task.task_execution_ms) as averageExecutionTime'
      ])
      .groupBy('executed_task.status')
      .getRawMany();

    return result.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      averageExecutionTime: parseFloat(row.averageExecutionTime) || 0,
    }));
  }
}