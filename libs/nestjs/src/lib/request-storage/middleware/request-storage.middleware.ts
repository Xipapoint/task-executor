import { Injectable, NestMiddleware } from "@nestjs/common";
import { RequestStorageInstance } from "../storage/RequestStorage";

@Injectable()
export class RequestStorageMiddleware implements NestMiddleware {
  use(
    request: Request,
    response: Response,
    next: (error?: object) => void,
  ): void {
    RequestStorageInstance.reset();

    next();
  }
}