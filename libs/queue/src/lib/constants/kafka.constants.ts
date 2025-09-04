

export enum KafkaPartitions {
  USER_LOGIN = 'USER_LOGIN',
  PURCHASED = 'PURCHASED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  REPLY_TOPIC = 'REPLY_TOPIC',
}

export enum KafkaTopics {
  LOGGING = 'logging',
  METRICS = 'metrics',
  REPLY_TOPIC = 'reply_topic',
}

export enum KafkaGroups {
  PRODUCER = 'producer-group',
  TASK_SERVICE = 'task-service-group',
  ANALYTICS_SERVICE = 'analytics-service-group',
}