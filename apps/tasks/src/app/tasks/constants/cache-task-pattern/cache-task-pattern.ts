export const CACHE_TASK_PATTERN = {
  TASK_PREFIX: 'task:',
  ALL_TASKS: 'task:*',
} as const;

export const getCacheTaskKey = (taskType: string): string => {
  return `${CACHE_TASK_PATTERN.TASK_PREFIX}${taskType}`;
};