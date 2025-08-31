# Task Management API Examples

Этот документ содержит примеры использования API для управления задачами.

## Управление доступностью задач

### Отключить задачу
```bash
curl -X PUT http://localhost:3000/api/tasks/user_login/availability \
  -H "Content-Type: application/json" \
  -d '{"isAvailable": false}'
```

### Включить задачу
```bash
curl -X PUT http://localhost:3000/api/tasks/user_login/availability \
  -H "Content-Type: application/json" \
  -d '{"isAvailable": true}'
```

### Проверить статус задачи
```bash
curl -X GET http://localhost:3000/api/tasks/user_login/status
```

### Получить все задачи из кеша
```bash
curl -X GET http://localhost:3000/api/tasks/cache/all
```

### Получить только доступные задачи
```bash
curl -X GET http://localhost:3000/api/tasks/cache/available
```

## Выполнение задач

### Выполнить задачу (будет проверена доступность)
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "user_login",
    "payload": {
      "userId": "123",
      "username": "test_user"
    }
  }'
```

### Получить информацию о доступных задачах
```bash
curl -X GET http://localhost:3000/api/tasks/available
```

## Ответы API

### Успешное отключение задачи
```json
{
  "success": true,
  "message": "Task user_login availability updated to false",
  "timestamp": "2025-08-31T10:30:00.000Z"
}
```

### Статус задачи
```json
{
  "success": true,
  "data": {
    "id": "task_user_login_1693478400000",
    "name": "user_login",
    "isAvailable": false,
    "taskType": "user_login",
    "queueName": "default",
    "createdAt": "2025-08-31T10:00:00.000Z",
    "updatedAt": "2025-08-31T10:30:00.000Z"
  },
  "timestamp": "2025-08-31T10:30:00.000Z"
}
```

### Ошибка при попытке выполнить отключенную задачу
```json
{
  "success": false,
  "message": "Task type user_login is currently disabled",
  "timestamp": "2025-08-31T10:35:00.000Z"
}
```
