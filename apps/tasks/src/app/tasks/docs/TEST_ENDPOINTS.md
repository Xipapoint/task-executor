# Task System Test Script

This document provides test commands for the task system endpoints.

## Prerequisites

Make sure the tasks application is running:
```bash
cd "C:\Users\Арсений\Desktop\message-system\message-system"
npx nx serve tasks
```

The server should be running on `http://localhost:3000/api`

## Test Commands

### 1. Health Check
```bash
curl -X GET http://localhost:3000/api/tasks/health
```

Expected response:
```json
{
  "success": true,
  "message": "Task service is healthy",
  "timestamp": "2025-08-30T22:13:51.000Z",
  "availableTaskTypes": 4
}
```

### 2. Get Available Task Types
```bash
curl -X GET http://localhost:3000/api/tasks/types
```

Expected response:
```json
{
  "success": true,
  "data": {
    "taskTypes": ["user_login", "purchased", "message_sent", "alert_triggered"],
    "count": 4
  },
  "timestamp": "2025-08-30T22:13:51.000Z"
}
```

### 3. Get All Tasks Info
```bash
curl -X GET http://localhost:3000/api/tasks/info
```

### 4. Get Specific Task Info
```bash
curl -X GET http://localhost:3000/api/tasks/info/user_login
```

### 5. Execute User Login Task
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "user_login",
    "payload": {
      "userId": "user123",
      "email": "user@example.com",
      "loginTime": "2025-08-30T22:00:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0"
    }
  }'
```

### 6. Execute Purchase Task
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "purchased",
    "payload": {
      "userId": "user123",
      "orderId": "order456",
      "productId": "product789",
      "amount": 99.99,
      "currency": "USD",
      "purchaseTime": "2025-08-30T22:00:00Z",
      "paymentMethod": "credit_card"
    }
  }'
```

### 7. Execute Message Sent Task
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "message_sent",
    "payload": {
      "messageId": "msg123",
      "senderId": "user123",
      "recipientId": "user456",
      "messageType": "text",
      "content": "Hello, how are you?",
      "sentTime": "2025-08-30T22:00:00Z",
      "channelId": "channel789"
    }
  }'
```

### 8. Execute Alert Triggered Task
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "alert_triggered",
    "payload": {
      "alertId": "alert123",
      "userId": "user123",
      "alertType": "security",
      "severity": "high",
      "title": "Suspicious Login Attempt",
      "message": "Login attempt from unknown location",
      "triggeredTime": "2025-08-30T22:00:00Z",
      "source": "auth-service",
      "metadata": {
        "attempts": 3,
        "lastKnownIp": "192.168.1.100"
      }
    }
  }'
```

### 9. Execute Batch Tasks (Parallel)
```bash
curl -X POST http://localhost:3000/api/tasks/execute-batch \
  -H "Content-Type: application/json" \
  -d '{
    "parallel": true,
    "tasks": [
      {
        "type": "user_login",
        "payload": {
          "userId": "user123",
          "email": "user@example.com",
          "loginTime": "2025-08-30T22:00:00Z",
          "ipAddress": "192.168.1.1"
        }
      },
      {
        "type": "message_sent",
        "payload": {
          "messageId": "msg456",
          "senderId": "user123",
          "recipientId": "user789",
          "messageType": "text",
          "content": "Welcome!",
          "sentTime": "2025-08-30T22:01:00Z"
        }
      }
    ]
  }'
```

### 10. Execute Batch Tasks (Sequential)
```bash
curl -X POST http://localhost:3000/api/tasks/execute-batch \
  -H "Content-Type: application/json" \
  -d '{
    "parallel": false,
    "tasks": [
      {
        "type": "purchased",
        "payload": {
          "userId": "user123",
          "orderId": "order789",
          "productId": "product123",
          "amount": 49.99,
          "currency": "USD",
          "purchaseTime": "2025-08-30T22:00:00Z",
          "paymentMethod": "paypal"
        }
      },
      {
        "type": "alert_triggered",
        "payload": {
          "alertId": "alert456",
          "userId": "user123",
          "alertType": "business",
          "severity": "medium",
          "title": "Purchase Confirmation",
          "message": "Your purchase has been processed",
          "triggeredTime": "2025-08-30T22:00:30Z",
          "source": "payment-service"
        }
      }
    ]
  }'
```

## PowerShell Test Commands

If using PowerShell, you can use `Invoke-RestMethod` instead:

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/health" -Method Get

# Execute task
$body = @{
    taskType = "user_login"
    payload = @{
        userId = "user123"
        email = "user@example.com"
        loginTime = "2025-08-30T22:00:00Z"
        ipAddress = "192.168.1.1"
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/execute" -Method Post -Body $body -ContentType "application/json"
```
