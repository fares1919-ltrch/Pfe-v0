# Appointments System Documentation

## Overview

The appointments system manages scheduling, tracking, and management of appointments for CPF-related services. It integrates with user management and center locations to provide a complete appointment management solution.

## Data Model

### Appointment Model

The core appointment model includes the following fields:

```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appointmentDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled", "missed"],
    default: "scheduled"
  },
  notes: String,
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## API Endpoints

### 1. Appointment Management

#### GET /api/appointments/slots

- **Description**: Get available appointment slots
- **Parameters**:
  - `date`: Date to check for slots (required)
  - `centerId`: Center ID (required)
- **Response**: List of available appointment slots

#### GET /api/appointments/user

- **Description**: Get user's own appointments
- **Security**: Requires user authentication
- **Response**: User's appointments with officer details

#### POST /api/appointments

- **Description**: Create new appointment (officer only)
- **Security**: Requires officer role
- **Request Body**:
  - `userId`: User ID
  - `officerId`: Officer ID
  - `appointmentDate`: Date and time of appointment
  - `notes`: Additional notes
  - `location`: Center ID
- **Response**: Created appointment details

#### GET /api/appointments/officer/:officerId

- **Description**: Get officer's appointments
- **Security**: Requires officer role
- **Response**: List of officer's appointments with user details

### 2. Appointment Status Management

#### PUT /api/appointments/:id/status

- **Description**: Update appointment status (officer only)
- **Security**: Requires officer role
- **Request Body**:
  - `status`: New status (completed/cancelled/missed)
  - `comments`: Optional comments
- **Response**: Updated appointment status details

#### PUT /api/appointments/:id/reschedule

- **Description**: Reschedule appointment
- **Security**: Requires officer role
- **Request Body**:
  - `newDateTime`: New appointment date and time
  - `reason`: Reason for rescheduling
- **Response**: Rescheduled appointment details

### 3. Center Management

#### GET /api/appointments/center/:centerId/daily

- **Description**: Get center's daily appointments
- **Security**: Requires officer role
- **Parameters**:
  - `date`: Optional date parameter
- **Response**: List of appointments for the specified date

#### DELETE /api/appointments/:id

- **Description**: Delete appointment (officer only)
- **Security**: Requires officer role
- **Response**: Confirmation message

### 4. Appointment Management

#### GET /api/appointments/:id

- **Description**: Get appointment details by ID
- **Security**: Requires user authentication
- **Parameters**:
  - `id`: Appointment ID
- **Response**: Appointment details

## Business Logic

### Appointment Creation

1. Validates officer role
2. Checks appointment status
3. Prevents duplicate appointments
4. Updates appointment status
5. Creates appointment record

### Status Updates

1. Only officers can update status
2. Status flow:
   - Initial: scheduled
   - Completion: completed
   - Cancellation: cancelled
   - No-show: missed
3. Maintains audit trail for changes

### Rescheduling

1. Validates officer role
2. Checks new date validity
3. Updates appointment status
4. Maintains audit trail

## Security Features

1. Role-based Access Control

   - Officers can create, update, and delete appointments
   - Users can view and reschedule their own appointments
   - All operations require proper authentication

2. Data Validation
   - Date format validation
   - Center working hours validation
   - Prevents overlapping appointments
   - Role validation for all operations

## Integration Points

1. Centers

   - Uses center working hours
   - Links to center location
   - Manages center capacity

2. Users
   - Links to users
   - Role-based access control
   - Notification system integration

## Error Handling

1. Common Error Cases:

   - Invalid date formats
   - Missing required parameters
   - Unauthorized access
   - Duplicate appointments
   - Non-existent resources

2. Error Responses:
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error

## Best Practices

1. Always validate user and officer roles before operations
2. Check appointment status before modifications
3. Maintain proper audit trail for all changes
4. Use proper date formatting and time zone handling
5. Implement rate limiting for appointment creation
6. Use optimistic locking for concurrent updates

## Future Enhancements

1. Add appointment reminders
2. Implement bulk appointment scheduling
3. Add appointment type categorization
4. Implement waiting list management
5. Add appointment duration tracking
6. Implement appointment analytics
7. Add support for multiple time zones
8. Implement appointment cancellation policies
9. Add support for recurring appointments
10. Implement appointment conflict detection
