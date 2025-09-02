import { TaskContractWithStartTime } from '../task/task.contract';
export interface MessageTaskContract extends TaskContractWithStartTime {
    /**
     * Start time is the metric when the user requested and the message was sent with the producer.
     * In seconds.
     *
     * @example
     * // 0.11
     */
    startTime: number;
}