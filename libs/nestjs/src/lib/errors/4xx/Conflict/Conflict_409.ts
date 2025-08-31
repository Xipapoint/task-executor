import { AppError } from '../../AppError/AppError';
export class ConflictError extends AppError {
    constructor(message = "Entity already exists") {
        super(message, 409);
    }
}