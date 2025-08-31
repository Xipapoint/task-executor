import { IErrorHandler } from '../interfaces/error-handler/error-handler.interface';
import { HttpException } from '@nestjs/common';

// Handles NestJS HttpException
export class HttpErrorHandler implements IErrorHandler<unknown> {
  canHandle(exception: unknown): boolean {
    return exception instanceof HttpException;
  }

  handle(exception: unknown) {
    const httpError = exception as HttpException;
    const responseBody = httpError.getResponse();
    return {
      statusCode: httpError.getStatus(),
      errorMessage:
        typeof responseBody === 'string'
          ? responseBody
          : (responseBody as any).message || 'Internal Server Error',
      isOperational: true,
    };
  }
}
