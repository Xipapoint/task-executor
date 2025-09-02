import { BaseTaskContract } from "../base-task.contract";

export interface TaskContract extends BaseTaskContract {
    /**
     * Start time is the metric when the user requested and the message was sent with the producer.
     * In seconds.
     *
     * @example
     * // 0.11
     */
    startTime: number;
}