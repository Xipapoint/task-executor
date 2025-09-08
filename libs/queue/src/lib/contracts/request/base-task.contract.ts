import { KafkaKeys } from '../../constants/kafka.constants';
import { Kafka } from 'kafkajs';
import { BaseMessageValue } from '../../interfaces';
export interface BaseTaskContract<T extends BaseMessageValue = BaseMessageValue> {
    key: KafkaKeys;
    value: T;
    headers: Record<string, string>;
}