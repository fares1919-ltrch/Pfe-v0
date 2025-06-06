# Appointment Management System Endpoints

This document provides a comprehensive guide to the appointment management API endpoints implemented in the current sprint.

## Authentication Information

### Citizen Account

- **Username**: khalil
- **Password**: Admin123!

### Officer Account

- **Username**: officer
- **Password**: Citizen@123

### Center ID (for testing)

```
680b6e64e380f42a424e789e
```

## Base URL

```
http://localhost:3000/api
```

## Appointment Endpoints

### 1. Create a New Appointment (Citizen)

Create a new appointment request with the citizen service center.

**Endpoint**: `POST /appointments`

**Authentication Required**: Yes (Citizen)

**Request Body**:

```json
{
  "centerId": "680b6e64e380f42a424e789e",
  "appointmentDate": "2023-06-28T10:30:00.000Z"
}
```

**Sample Response**:

```json
{
  "success": true,
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "appointmentDate": "2023-06-28T10:30:00.000Z",
    "status": "pending",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-25T14:22:18.345Z",
    "center": {
      "_id": "680b6e64e380f42a424e789e",
      "name": "Mahdia Regional Center",
      "address": {
        "street": "Rue Ibn Khaldoun",
        "city": "Mahdia",
        "state": "Mahdia Governorate",
        "postalCode": "5100",
        "lon": 11.0622,
        "lat": 35.5049
      }
    }
  }
}
```

### 2. Get All User Appointments (Citizen)

Retrieve all appointments for the currently authenticated citizen.

**Endpoint**: `GET /appointments`

**Authentication Required**: Yes (Citizen)

**Sample Response**:

```json
{
  "success": true,
  "appointments": [
    {
      "_id": "6573829ac7e2f15a3e9d5b23",
      "userId": "6573724ac7e2f15a3e9d5b1a",
      "centerId": "680b6e64e380f42a424e789e",
      "appointmentDate": "2023-06-28T10:30:00.000Z",
      "status": "pending",
      "createdAt": "2023-06-25T14:22:18.345Z",
      "updatedAt": "2023-06-25T14:22:18.345Z",
      "center": {
        "_id": "680b6e64e380f42a424e789e",
        "name": "Mahdia Regional Center",
        "address": {
          "street": "Rue Ibn Khaldoun",
          "city": "Mahdia",
          "state": "Mahdia Governorate",
          "postalCode": "5100",
          "lon": 11.0622,
          "lat": 35.5049
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

### 3. Get Appointment by ID (Citizen or Officer)

Retrieve a specific appointment by its ID.

**Endpoint**: `GET /appointments/:id`

**Authentication Required**: Yes (Citizen or Officer)

**Sample Response**:

```json
{
  "success": true,
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "appointmentDate": "2023-06-28T10:30:00.000Z",
    "status": "pending",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-25T14:22:18.345Z",
    "center": {
      "_id": "680b6e64e380f42a424e789e",
      "name": "Mahdia Regional Center",
      "address": {
        "street": "Rue Ibn Khaldoun",
        "city": "Mahdia",
        "state": "Mahdia Governorate",
        "postalCode": "5100"
      }
    },
    "user": {
      "_id": "6573724ac7e2f15a3e9d5b1a",
      "firstName": "Khalil",
      "lastName": "Belaid",
      "email": "khalil@example.com"
    }
  }
}
```

### 4. Reschedule an Appointment (Citizen)

Change the date and time of an existing appointment.

**Endpoint**: `PUT /appointments/:id/reschedule`

**Authentication Required**: Yes (Citizen)

**Request Body**:

```json
{
  "appointmentDate": "2023-06-30T14:00:00.000Z"
}
```

**Sample Response**:

```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "appointmentDate": "2023-06-30T14:00:00.000Z",
    "status": "pending",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-25T15:30:45.123Z"
  }
}
```

### 5. Cancel an Appointment (Citizen)

Cancel an existing appointment.

**Endpoint**: `PUT /appointments/:id/cancel`

**Authentication Required**: Yes (Citizen)

**Sample Response**:

```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "appointmentDate": "2023-06-30T14:00:00.000Z",
    "status": "cancelled",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-25T16:05:32.789Z"
  }
}
```

### 6. Delete an Appointment (Citizen)

Permanently delete an appointment.

**Endpoint**: `DELETE /appointments/:id`

**Authentication Required**: Yes (Citizen)

**Sample Response**:

```json
{
  "success": true,
  "message": "Appointment deleted successfully"
}
```

### 7. Get All Pending Appointments (Officer)

Retrieve all pending appointments for validation by an officer.

**Endpoint**: `GET /appointments/pending`

**Authentication Required**: Yes (Officer)

**Sample Response**:

```json
{
  "success": true,
  "appointments": [
    {
      "_id": "6573829ac7e2f15a3e9d5b23",
      "userId": "6573724ac7e2f15a3e9d5b1a",
      "centerId": "680b6e64e380f42a424e789e",
      "appointmentDate": "2023-06-28T10:30:00.000Z",
      "status": "pending",
      "createdAt": "2023-06-25T14:22:18.345Z",
      "updatedAt": "2023-06-25T14:22:18.345Z",
      "center": {
        "_id": "680b6e64e380f42a424e789e",
        "name": "Mahdia Regional Center"
      },
      "user": {
        "_id": "6573724ac7e2f15a3e9d5b1a",
        "firstName": "Khalil",
        "lastName": "Belaid",
        "email": "khalil@example.com"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

### 8. Get All Validated Appointments (Officer)

Retrieve all validated appointments for an officer.

**Endpoint**: `GET /appointments/validated`

**Authentication Required**: Yes (Officer)

**Sample Response**:

```json
{
  "success": true,
  "appointments": [
    {
      "_id": "6573829ac7e2f15a3e9d5b24",
      "userId": "6573724ac7e2f15a3e9d5b1b",
      "centerId": "680b6e64e380f42a424e789e",
      "officerId": "6573724fc7e2f15a3e9d5b1e",
      "appointmentDate": "2023-06-29T11:30:00.000Z",
      "status": "validated",
      "createdAt": "2023-06-25T14:22:18.345Z",
      "updatedAt": "2023-06-25T17:10:05.421Z",
      "center": {
        "_id": "680b6e64e380f42a424e789e",
        "name": "Mahdia Regional Center"
      },
      "user": {
        "_id": "6573724ac7e2f15a3e9d5b1b",
        "firstName": "Omar",
        "lastName": "Chahed",
        "email": "omar@example.com"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

### 9. Validate an Appointment (Officer)

Approve a pending appointment.

**Endpoint**: `PUT /appointments/:id/validate`

**Authentication Required**: Yes (Officer)

**Request Body**:

```json
{
  "comment": "Appointment approved for CPF registration"
}
```

**Sample Response**:

```json
{
  "success": true,
  "message": "Appointment validated successfully",
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "officerId": "6573724fc7e2f15a3e9d5b1e",
    "appointmentDate": "2023-06-28T10:30:00.000Z",
    "status": "validated",
    "comment": "Appointment approved for CPF registration",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-26T09:15:22.654Z"
  }
}
```

### 10. Reject an Appointment (Officer)

Reject a pending appointment.

**Endpoint**: `PUT /appointments/:id/reject`

**Authentication Required**: Yes (Officer)

**Request Body**:

```json
{
  "comment": "Invalid information provided. Please reschedule with correct details."
}
```

**Sample Response**:

```json
{
  "success": true,
  "message": "Appointment rejected successfully",
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "officerId": "6573724fc7e2f15a3e9d5b1e",
    "appointmentDate": "2023-06-28T10:30:00.000Z",
    "status": "rejected",
    "comment": "Invalid information provided. Please reschedule with correct details.",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-26T10:05:18.321Z"
  }
}
```

### 11. Mark Appointment as Completed (Officer)

Mark a validated appointment as completed after the citizen's visit.

**Endpoint**: `PUT /appointments/:id/complete`

**Authentication Required**: Yes (Officer)

**Request Body**:

```json
{
  "comment": "Biometric data collected and verified successfully."
}
```

**Sample Response**:

```json
{
  "success": true,
  "message": "Appointment marked as completed",
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "officerId": "6573724fc7e2f15a3e9d5b1e",
    "appointmentDate": "2023-06-28T10:30:00.000Z",
    "status": "completed",
    "comment": "Biometric data collected and verified successfully.",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-28T11:45:36.987Z"
  }
}
```

### 12. Mark Appointment as Missed (Officer)

Mark a validated appointment as missed if the citizen doesn't show up.

**Endpoint**: `PUT /appointments/:id/miss`

**Authentication Required**: Yes (Officer)

**Request Body**:

```json
{
  "comment": "Citizen did not show up for the scheduled appointment."
}
```

**Sample Response**:

```json
{
  "success": true,
  "message": "Appointment marked as missed",
  "appointment": {
    "_id": "6573829ac7e2f15a3e9d5b23",
    "userId": "6573724ac7e2f15a3e9d5b1a",
    "centerId": "680b6e64e380f42a424e789e",
    "officerId": "6573724fc7e2f15a3e9d5b1e",
    "appointmentDate": "2023-06-28T10:30:00.000Z",
    "status": "missed",
    "comment": "Citizen did not show up for the scheduled appointment.",
    "createdAt": "2023-06-25T14:22:18.345Z",
    "updatedAt": "2023-06-28T12:35:42.123Z"
  }
}
```

### 13. Get Available Time Slots for a Center

Get available appointment time slots for a specific date and center.

**Endpoint**: `GET /appointments/available-slots`

**Query Parameters**:

- `date`: Date in YYYY-MM-DD format
- `centerId`: ID of the center

**Sample Request**:

```
GET /api/appointments/available-slots?date=2023-06-30&centerId=680b6e64e380f42a424e789e
```

**Sample Response**:

```json
{
  "success": true,
  "date": "2023-06-30",
  "center": "680b6e64e380f42a424e789e",
  "slots": [
    {
      "time": "09:00",
      "available": true
    },
    {
      "time": "09:30",
      "available": true
    },
    {
      "time": "10:00",
      "available": false
    },
    {
      "time": "10:30",
      "available": true
    },
    {
      "time": "11:00",
      "available": true
    },
    {
      "time": "11:30",
      "available": true
    },
    {
      "time": "12:00",
      "available": false
    },
    {
      "time": "12:30",
      "available": true
    },
    {
      "time": "13:00",
      "available": true
    },
    {
      "time": "13:30",
      "available": true
    },
    {
      "time": "14:00",
      "available": true
    },
    {
      "time": "14:30",
      "available": true
    },
    {
      "time": "15:00",
      "available": true
    },
    {
      "time": "15:30",
      "available": true
    },
    {
      "time": "16:00",
      "available": true
    }
  ]
}
```

## Testing the Endpoints

To test these endpoints, you can use tools like:

- Postman
- cURL
- Any HTTP client

### Authentication

All endpoints require authentication using JWT. To authenticate:

1. First, log in using the appropriate credentials:

**Endpoint**: `POST /auth/login`

**Request Body for Citizen**:

```json
{
  "username": "khalil",
  "password": "Admin123!"
}
```

**Request Body for Officer**:

```json
{
  "username": "officer",
  "password": "Citizen@123"
}
```

2. The login response will include a JWT token. Use this token in the Authorization header for all subsequent requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Error Handling

The API returns appropriate HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message details"
}
```

## Workflow Example

1. Citizen creates an appointment (POST /appointments)
2. Officer views pending appointments (GET /appointments/pending)
3. Officer validates or rejects the appointment (PUT /appointments/:id/validate or PUT /appointments/:id/reject)
4. If validated, the appointment appears in the officer's validated list (GET /appointments/validated)
5. After the appointment date, the officer marks it as completed or missed (PUT /appointments/:id/complete or PUT /appointments/:id/miss)
6. Citizen can view all their appointments, including the status (GET /appointments)
