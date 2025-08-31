import { IErrorResponse } from '../error-response/error-response.interface';
// Interface for error handler strategy
export interface IErrorHandler<T = unknown> {
  canHandle(exception: T): boolean;
  handle(exception: T): IErrorResponse;
}
