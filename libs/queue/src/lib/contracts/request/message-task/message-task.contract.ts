import { TaskContractWithStartTime } from '../task/task.contract';
export interface MessageTaskContract extends TaskContractWithStartTime {
    message: string
}