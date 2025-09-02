export interface BaseTaskResponseContract {
    id: string;
    topic: string;
    status: 'success' | 'error';
    error?: string;
}