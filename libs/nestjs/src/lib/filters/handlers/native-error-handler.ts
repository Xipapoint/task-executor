import { IErrorHandler } from '../interfaces/error-handler/error-handler.interface';

// Handles native JS Error
export class NativeErrorHandler implements IErrorHandler<unknown> {
  canHandle(exception: unknown): boolean {
    return exception instanceof Error;
  }

  handle(exception: unknown) {
    const err = exception as Error;
    return {
      statusCode: 500,
      errorMessage: err.message || 'Internal Server Error',
      isOperational: false,
    };
  }
}
