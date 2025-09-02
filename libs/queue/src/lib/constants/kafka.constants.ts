export enum KafkaTopics {
  USER_LOGIN = 'USER_LOGIN',
  PURCHASED = 'PURCHASED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
}

export enum KafkaGroups {
  PRODUCER = 'producer-group',
  TASK_SERVICE = 'task-service-group',
  ANALYTICS_SERVICE = 'analytics-service-group',
}