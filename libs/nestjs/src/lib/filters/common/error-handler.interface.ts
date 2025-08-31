// Interface for error handler strategy
export interface IErrorHandler<T = any, R = any> {
  canHandle(exception: T): boolean;
  handle(exception: T): R;
}
