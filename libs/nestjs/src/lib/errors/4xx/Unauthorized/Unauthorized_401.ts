import { AppError } from '../../AppError/AppError';
export class Unauthorized extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}