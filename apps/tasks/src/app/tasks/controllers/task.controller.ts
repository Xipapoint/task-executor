import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { CatchFilter, MetricsInterceptor } from '@message-system/nestjs';
import {
  AllTasksInfoResponseDto,
  AvailableTaskTypesResponseDto,
  BaseResponseDto,
  BatchTaskDto,
  BatchTaskExecutionResponseDto,
  CachedTasksResponseDto,
  ExecuteTaskDto,
  HealthCheckResponseDto,
  TaskExecutionResponseDto,
  TaskInfoResponseDto,
  TaskStatusResponseDto,
  UpdateTaskAvailabilityDto
} from '../dto';
import { TaskType } from '../factories/task.factory';
import { TaskService } from '../services/task.service';

@ApiTags('tasks')
@Controller('tasks')
@UseFilters(CatchFilter)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Execute a single task',
    description: 'Executes a single task of the specified type with the provided payload and options'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task executed successfully',
    type: TaskExecutionResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid task type or payload',
    type: BaseResponseDto
  })
  @ApiBody({ type: ExecuteTaskDto })
  async executeTask(@Body() dto: ExecuteTaskDto) {
    await this.taskService.executeTask(dto.taskType, dto.payload, dto.options);
    return {
      success: true,
      message: `Task ${dto.taskType} executed successfully`,
      timestamp: new Date().toISOString()
    };
  }

  @Post('execute-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Execute multiple tasks',
    description: 'Executes multiple tasks either in parallel or sequentially based on the parallel flag'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Tasks executed successfully',
    type: BatchTaskExecutionResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid tasks or execution failed',
    type: BaseResponseDto
  })
  @ApiBody({ type: BatchTaskDto })
  async executeTasksBatch(@Body() dto: BatchTaskDto) {
    const { parallel, tasks } = dto
    if (parallel) {
      await this.taskService.executeTasksBatch(tasks);
    } else {
      await this.taskService.executeTasksSequential(tasks);
    }

    return {
      success: true,
      message: `${tasks.length} tasks executed successfully ${parallel ? 'in parallel' : 'sequentially'}`,
      executedTasks: tasks.length,
      executionMode: parallel ? 'parallel' : 'sequential',
      timestamp: new Date().toISOString()
    };
  }

  @Get('info/:taskType')
  @ApiOperation({ 
    summary: 'Get task information',
    description: 'Retrieves detailed information about a specific task type'
  })
  @ApiParam({ 
    name: 'taskType', 
    description: 'Type of task to get information for',
    enum: ['user_login', 'purchased', 'message_sent', 'alert_triggered']
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task information retrieved successfully',
    type: TaskInfoResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Unknown task type',
    type: BaseResponseDto
  })
  async getTaskInfo(@Param('taskType') taskType: string) {
    const availableTypes = await this.taskService.getAvailableTaskTypes();
    if (!availableTypes.includes(taskType as TaskType)) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    const taskInfo = await this.taskService.getTaskInfo(taskType as TaskType);
    return {
      success: true,
      data: taskInfo,
      timestamp: new Date().toISOString()
    };
  }

  @Get('types')
  @ApiOperation({ 
    summary: 'Get available task types',
    description: 'Retrieves all available task types that can be executed'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Available task types retrieved successfully',
    type: AvailableTaskTypesResponseDto
  })
  async getAvailableTaskTypes() {
    const taskTypes = await this.taskService.getAvailableTaskTypes();
    return {
      success: true,
      data: {
        taskTypes,
        count: taskTypes.length
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('info')
  @ApiOperation({ 
    summary: 'Get all tasks information',
    description: 'Retrieves detailed information about all available task types'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All tasks information retrieved successfully',
    type: AllTasksInfoResponseDto
  })
  async getAllTasksInfo() {
    const tasksInfo = await this.taskService.getAllTasksInfo();
    return {
      success: true,
      data: {
        tasks: tasksInfo,
        count: tasksInfo.length
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Checks the health status of the task service and returns available task types count'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service is healthy',
    type: HealthCheckResponseDto
  })
  async healthCheck() {
    const availableTaskTypes = await this.taskService.getAvailableTaskTypes();
    return {
      success: true,
      message: 'Task service is healthy',
      timestamp: new Date().toISOString(),
      availableTaskTypes: availableTaskTypes.length
    };
  }

  @Put(':taskType/availability')
  @ApiOperation({ 
    summary: 'Update task availability',
    description: 'Updates the availability status of a specific task type'
  })
  @ApiParam({ 
    name: 'taskType', 
    description: 'Type of task to update availability for',
    enum: ['user_login', 'purchased', 'message_sent', 'alert_triggered']
  })
  @ApiBody({ type: UpdateTaskAvailabilityDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task availability updated successfully',
    type: BaseResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Failed to update task availability',
    type: BaseResponseDto
  })
  async updateTaskAvailability(
    @Param('taskType') taskType: string,
    @Body() body: UpdateTaskAvailabilityDto
  ) {
    await this.taskService.updateTaskAvailability(taskType, body.isAvailable);
    return {
      success: true,
      message: `Task ${taskType} availability updated to ${body.isAvailable}`,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':taskType/status')
  @ApiOperation({ 
    summary: 'Get task status',
    description: 'Retrieves the current status of a specific task type from cache'
  })
  @ApiParam({ 
    name: 'taskType', 
    description: 'Type of task to get status for',
    enum: ['user_login', 'purchased', 'message_sent', 'alert_triggered']
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task status retrieved successfully',
    type: TaskStatusResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Failed to get task status',
    type: BaseResponseDto
  })
  async getTaskStatus(@Param('taskType') taskType: string) {
    const status = await this.taskService.getTaskStatus(taskType);
    return {
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    };
  }

  @Get('cache/all')
  @ApiOperation({ 
    summary: 'Get all cached tasks',
    description: 'Retrieves all tasks with their cache status and metadata'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All cached tasks retrieved successfully',
    type: CachedTasksResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Failed to get cached tasks',
    type: BaseResponseDto
  })
  async getAllCachedTasks() {
    const tasks = await this.taskService.getAllTasks();
    return {
      success: true,
      data: tasks,
      count: tasks.length,
      timestamp: new Date().toISOString()
    };
  }

  @Get('cache/available')
  @ApiOperation({ 
    summary: 'Get available cached tasks',
    description: 'Retrieves only available tasks from cache (tasks that are enabled for execution)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Available cached tasks retrieved successfully',
    type: CachedTasksResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Failed to get available cached tasks',
    type: BaseResponseDto
  })
  async getAvailableCachedTasks() {
    const tasks = await this.taskService.getAvailableTasks();
    return {
      success: true,
      data: tasks,
      count: tasks.length,
      timestamp: new Date().toISOString()
    };
  }
}
