import { BaseTaskResponseContract } from "../base-task.response.contract";

export interface TaskResponseContract extends BaseTaskResponseContract {
    /**
     * End time is the metric when the message was processed and the response was sent back.
     * Calculated as the sum of the start time and the processing duration.
     * In seconds.
     *
     * @example
     * // 0.22
     */
    endTime: number;
}