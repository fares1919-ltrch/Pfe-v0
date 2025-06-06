# Notification System Documentation

## Overview

The notification system is designed to keep users informed about important events and updates in the system. It supports different types of notifications and provides various endpoints for managing notifications.

## Notification Types

- **appointment**: For appointment-related notifications
- **status_update**: For appointment status updates
- **document**: For document-related notifications
- **system**: For general system notifications

## Key Features

- Each notification is tied to a specific user (userId)
- Notifications can be marked as read/unread
- Includes metadata linking to related objects (appointments, requests, documents)
- Has timestamps for creation and updates
- Supports pagination for viewing notifications

## API Endpoints

### 1. Send Notification

**POST `/api/notifications`**

**Request Body**:

```json
{
  "userId": "67f6794af0efa34b98604004",
  "title": "Appointment Approved",
  "message": "Your appointment has been approved by the officer",
  "type": "status_update",
  "metadata": {
    "appointmentId": "67f96a10db815fa08a2b2b38"
  }
}
```

**Response**:

```json
{
  "message": "Notification sent successfully",
  "notification": {
    "_id": "67f96a10db815fa08a2b2b38",
    "userId": "67f6794af0efa34b98604004",
    "title": "Appointment Approved",
    "message": "Your appointment has been approved by the officer",
    "type": "status_update",
    "read": false,
    "metadata": {
      "appointmentId": "67f96a10db815fa08a2b2b38"
    },
    "createdAt": "2025-04-15T08:00:00.000Z",
    "updatedAt": "2025-04-15T08:00:00.000Z"
  }
}
```

### 2. Get User's Notifications

**GET `/api/notifications`**

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `read`: Filter by read status (true/false)

**Response**:

```json
{
  "notifications": [
    {
      "_id": "67f96a10db815fa08a2b2b38",
      "userId": "67f6794af0efa34b98604004",
      "title": "Appointment Approved",
      "message": "Your appointment has been approved by the officer",
      "type": "status_update",
      "read": false,
      "metadata": {
        "appointmentId": "67f96a10db815fa08a2b2b38"
      },
      "createdAt": "2025-04-15T08:00:00.000Z"
    }
  ],
  "currentPage": 1,
  "totalPages": 1,
  "totalNotifications": 1
}
```

### 3. Mark Notification as Read

**PUT `/api/notifications/:id/read`**

**Response**:

```json
{
  "message": "Notification marked as read"
}
```

### 4. Mark All Notifications as Read

**PUT `/api/notifications/read-all`**

**Response**:

```json
{
  "message": "All notifications marked as read"
}
```

### 5. Get Unread Notifications Count

**GET `/api/notifications/unread-count`**

**Response**:

```json
{
  "count": 3
}
```

### 6. Delete Notification

**DELETE `/api/notifications/:id`**

**Response**:

```json
{
  "message": "Notification deleted successfully"
}
```

## Notification Examples

### Appointment Notification

```json
{
  "userId": "67f6794af0efa34b98604004",
  "title": "Appointment Rescheduled",
  "message": "Your appointment has been rescheduled to April 15, 2025 at 10:00 AM",
  "type": "appointment",
  "metadata": {
    "appointmentId": "67f96a10db815fa08a2b2b38"
  }
}
```

### Request Status Notification

```json
{
  "userId": "67f6794af0efa34b98604004",
  "title": "Appointment Approved",
  "message": "Your appointment has been approved by the officer",
  "type": "status_update",
  "metadata": {
    "appointmentId": "67f969cfdb815fa08a2b2ad1"
  }
}
```

### Document Notification

```json
{
  "userId": "67f6794af0efa34b98604004",
  "title": "Document Uploaded",
  "message": "Your document has been successfully uploaded and is being processed",
  "type": "document",
  "metadata": {
    "documentId": "67f96a10db815fa08a2b2b39"
  }
}
```

### System Notification

```json
{
  "userId": "67f6794af0efa34b98604004",
  "title": "System Maintenance",
  "message": "The system will be undergoing maintenance from 10:00 PM to 12:00 AM",
  "type": "system"
}
```

## Error Responses

Common error responses:

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Authentication

All endpoints require authentication using JWT token in the Authorization header:

```
Authorization: Bearer <token>
```
