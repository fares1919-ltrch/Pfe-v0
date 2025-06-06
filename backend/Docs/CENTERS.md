# Centers System Documentation

## Overview
The Centers system manages the collection centers for CPF-related services. It integrates with the appointments and statistics systems to provide a complete solution for managing service delivery locations.

## Data Model

### Center Model
The core center model includes the following fields:

```javascript
{
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    lon: { type: Number, required: true },
    lat: { type: Number, required: true }
  },
  region: { type: String, required: true },
  capacity: {
    daily: { type: Number, required: true },
    hourly: { type: Number, required: true }
  },
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active"
  },
  contact: {
    phone: String,
    email: String
  },
  services: [{
    type: String,
    enum: ["cpf", "biometric", "document"]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## API Endpoints

### 1. Center Management

#### GET /api/centers
- **Description**: Get all centers
- **Response**: List of centers with basic information

#### GET /api/centers/:id
- **Description**: Get center by ID
- **Parameters**:
  - `id`: Center ID
- **Response**: Detailed center information

#### POST /api/centers
- **Description**: Create new center (officer only)
- **Security**: Requires officer role
- **Request Body**:
  - `name`: Center name
  - `address`: Center address
  - `region`: Region location
  - `capacity`: Daily and hourly capacity
  - `workingHours`: Weekly working hours
  - `status`: Center status
  - `contact`: Contact information
  - `services`: Available services
- **Response**: Created center details

#### PUT /api/centers/:id
- **Description**: Update center information (officer only)
- **Security**: Requires officer role
- **Parameters**:
  - `id`: Center ID
- **Request Body**: Updated center information
- **Response**: Updated center details

### 2. Center Operations

#### GET /api/centers/:id/schedule
- **Description**: Get center's daily schedule
- **Security**: Requires officer role
- **Parameters**:
  - `id`: Center ID
  - `date`: Optional date parameter
- **Response**: List of appointments for the day

#### GET /api/centers/:id/stats
- **Description**: Get center statistics
- **Security**: Requires officer role
- **Parameters**:
  - `id`: Center ID
  - `startDate`: Optional start date
  - `endDate`: Optional end date
- **Response**: Center statistics including:
  - Total appointments
  - Completed appointments
  - Rescheduled appointments
  - No-show appointments
  - Average processing time
  - Biometric collection success rate

## Business Logic

### Center Creation
1. Validates required fields
2. Sets default status to active
3. Creates center record
4. Maintains working hours
5. Links available services

### Status Management
1. Status flow:
   - Active: Normal operation
   - Inactive: Temporarily closed
   - Maintenance: Under maintenance
2. Status changes trigger:
   - Appointment validation
   - Schedule updates
   - Statistics calculation

### Capacity Management
1. Daily capacity:
   - Maximum appointments per day
   - Prevents overbooking
2. Hourly capacity:
   - Maximum appointments per hour
   - Maintains service quality
3. Working hours:
   - Weekly schedule
   - Holiday handling
   - Time zone considerations

## Security Features

1. Role-based Access Control:
   - Only officers can create/update centers
   - Officers can view all centers
   - Users can view active centers

2. Data Protection:
   - Center information is protected
   - Working hours are validated
   - Capacity limits are enforced

## Integration Points

1. Appointments System:
   - Links to appointment slots
   - Validates capacity limits
   - Manages working hours

2. Statistics System:
   - Tracks appointment metrics
   - Calculates processing times
   - Measures service success

3. Services System:
   - Links available services
   - Manages service capacity
   - Tracks service performance

## Error Handling

1. Common Error Cases:
   - Invalid address formats
   - Invalid working hours
   - Capacity limits exceeded
   - Invalid status transitions
   - Unauthorized access

2. Error Responses:
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error

## Best Practices

1. Center Management:
   - Validate all address information
   - Set realistic capacity limits
   - Maintain accurate working hours
   - Regularly update status
   - Track service performance

2. Officer Operations:
   - Document all changes
   - Maintain capacity limits
   - Monitor service performance
   - Handle maintenance properly
   - Track statistics regularly

3. System Integration:
   - Synchronize with appointments
   - Maintain data consistency
   - Handle concurrent updates
   - Implement proper error handling
   - Track all changes

## Future Enhancements

1. Center Management:
   - Add bulk center operations
   - Implement center templates
   - Add regional management
   - Implement center archiving
   - Add holiday management

2. Statistics & Analytics:
   - Add real-time monitoring
   - Implement predictive analytics
   - Add performance benchmarks
   - Implement capacity planning
   - Add service quality metrics

3. Service Management:
   - Add service categories
   - Implement service templates
   - Add service scheduling
   - Implement service automation
   - Add service reporting

4. System Features:
   - Add center validation rules
   - Implement center automation
   - Add center reporting
   - Implement center archiving
   - Add center auditing
