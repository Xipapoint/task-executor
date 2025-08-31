
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorHandlerFactory } from '../common/error-handler-factory';

@Catch()
@Injectable()
export class CatchFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchFilter.name);
  private readonly errorHandlerFactory = new ErrorHandlerFactory();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const handler = this.errorHandlerFactory.getHandler(exception);
    const result = handler.handle(exception);

    if (!result.isOperational) {
      this.logger.error(`Non-operational error: ${result.errorMessage}`);
      // TODO: SEND ALERT TO LOGGING AWS MICROSERVICE
    } else if (result.statusCode && result.statusCode >= 500) {
      this.logger.error(result.errorMessage);
      // TODO: SEND ALERT TO LOGGING AWS MICROSERVICE
    } else {
      this.logger.warn(`[${result.statusCode}] ${result.errorMessage}`);
    }

    response.status(result.statusCode).json({
      success: false,
      message: result.errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}