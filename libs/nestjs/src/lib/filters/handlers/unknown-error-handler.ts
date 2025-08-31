import { IErrorHandler } from '../interfaces/error-handler/error-handler.interface';

// Handles unknown error types
export class UnknownErrorHandler implements IErrorHandler<unknown> {
  canHandle(_exception: unknown): boolean {
    return true; // Always matches last
  }

  handle(exception: unknown) {
    return {
      statusCode: 500,
      errorMessage: `Unknown error: ${JSON.stringify(exception)}`,
      isOperational: false,
    };
  }
}
