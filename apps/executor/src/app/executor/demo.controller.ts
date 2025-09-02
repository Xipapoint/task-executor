import { Controller, Post, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DemoService } from './demo.service';

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  private readonly logger = new Logger(DemoController.name);

  constructor(private readonly demoService: DemoService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get system status' })
  @ApiResponse({ status: 200, description: 'Current system status' })
  getStatus() {
    return this.demoService.getSystemStatus();
  }

  @Post('user-login')
  @ApiOperation({ summary: 'Demo: Execute user login task' })
  @ApiResponse({ status: 200, description: 'User login demo executed' })
  async demoUserLogin() {
    await this.demoService.demoUserLogin();
    return {
      success: true,
      message: 'User login demo executed',
      timestamp: new Date().toISOString()
    };
  }

  @Post('fire-and-forget')
  @ApiOperation({ summary: 'Demo: Send fire-and-forget message' })
  @ApiResponse({ status: 200, description: 'Fire-and-forget demo executed' })
  async demoFireAndForget() {
    await this.demoService.demoFireAndForget();
    return {
      success: true,
      message: 'Fire-and-forget demo executed',
      timestamp: new Date().toISOString()
    };
  }

  @Post('batch-processing')
  @ApiOperation({ summary: 'Demo: Execute batch processing' })
  @ApiResponse({ status: 200, description: 'Batch processing demo executed' })
  async demoBatchProcessing() {
    await this.demoService.demoBatchProcessing();
    return {
      success: true,
      message: 'Batch processing demo executed',
      timestamp: new Date().toISOString()
    };
  }

  @Post('sse-broadcast')
  @ApiOperation({ summary: 'Demo: SSE broadcasting to multiple channels' })
  @ApiResponse({ status: 200, description: 'SSE broadcasting demo executed' })
  async demoSSEBroadcast() {
    await this.demoService.demoSSEBroadcast();
    return {
      success: true,
      message: 'SSE broadcasting demo executed',
      timestamp: new Date().toISOString()
    };
  }

  @Post('run-all')
  @ApiOperation({ summary: 'Demo: Run all demos sequentially' })
  @ApiResponse({ status: 200, description: 'All demos executed' })
  async runAllDemos() {
    // Run in background to avoid timeout
    setImmediate(() => {
      this.demoService.runAllDemos().catch(error => {
        this.logger.error('Demo sequence failed:', error);
      });
    });

    return {
      success: true,
      message: 'All demos started - check SSE stream and logs for progress',
      timestamp: new Date().toISOString()
    };
  }
}
