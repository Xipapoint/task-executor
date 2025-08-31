import { IErrorHandler } from '../interfaces/error-handler/error-handler.interface';
import { AppErrorHandler } from '../handlers/app-error-handler';
import { HttpErrorHandler } from '../handlers/http-error-handler';
import { NativeErrorHandler } from '../handlers/native-error-handler';
import { UnknownErrorHandler } from '../handlers/unknown-error-handler';

// Factory for error handler strategies
export class ErrorHandlerFactory {
  private readonly handlers: IErrorHandler[];

  constructor() {
    this.handlers = [
      new AppErrorHandler(),
      new HttpErrorHandler(),
      new NativeErrorHandler(),
      new UnknownErrorHandler(),
    ];
  }

  getHandler(exception: unknown): IErrorHandler {
    return this.handlers.find((h) => h.canHandle(exception))!;
  }
}
