import { IErrorHandler } from '../interfaces/error-handler/error-handler.interface';
import { AppError } from '../../errors/AppError/AppError';

// Handles AppError instances
export class AppErrorHandler implements IErrorHandler<unknown> {
  canHandle(exception: unknown): boolean {
    return exception instanceof AppError;
  }

  handle(exception: unknown) {
    const appError = exception as AppError;
    return {
      statusCode: appError.statusCode,
      errorMessage: appError.message,
      isOperational: appError.isOperational,
    };
  }
}
