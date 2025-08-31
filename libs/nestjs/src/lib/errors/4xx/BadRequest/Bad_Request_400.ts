import { AppError } from "../../AppError/AppError";

export class BadRequest extends AppError {
    constructor(message = "Bad Request") {
        super(message, 400);
    }
}