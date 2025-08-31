import { AppError } from "../../AppError/AppError";

export class RequestTimeout extends AppError {
    constructor(message = "Request Timeout") {
        super(message, 408);
    }
}