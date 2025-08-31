import { AppError } from "../../AppError/AppError";

export class NotFound extends AppError {
    constructor(message = "Not found") {
        super(message, 404);
    }
}