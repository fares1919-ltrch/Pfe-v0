# CPF System - Backend Documentation

## Overview

The CPF System is a comprehensive platform designed to manage the issuance and verification of CPF (Cadastro de Pessoas Físicas) numbers in Brazil. This system handles user registration, appointments, biometric data collection, and credential issuance.

## System Architecture

The backend is built using:

- **Node.js** with **Express.js** framework
- **MongoDB** database with **Mongoose** ODM
- **JWT** for authentication and authorization
- **Swagger** for API documentation
- **Passport.js** for OAuth integration

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│    Client    │◄────┤     API      │◄────┤   Database   │
│ Application  │     │    Server    │     │  (MongoDB)   │
│              │────►│   (Express)  │────►│              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  External    │
                     │  Services    │
                     │  - Email     │
                     │  - OAuth     │
                     └──────────────┘
```

## Core Features

1. **User Management**

   - User registration and authentication
   - Role-based access control (user, officer, manager)
   - OAuth integration with Google and GitHub

2. **Appointment Process**

   - Request submission

3. **Biometric Data Collection**

   - Fingerprint, face, and iris scanning
   - Supporting document management
   - Data verification

4. **Credential Issuance**

   - CPF credential generation
   - Verification mechanisms
   - Revocation handling

5. **Notification System**

   - Event-based notifications
   - User alerts and reminders

6. **Center Management**
   - Service center registration
   - Capacity and availability planning
   - Geographic distribution

## Data Models

### User Model

- Basic user information
- Authentication details
- Role associations

### Appointment Model

- Request details

### Biometric Data Model

- Fingerprints
- Facial data
- Iris scans
- Supporting documents

### CPF Credential Model

- Credential details
- Issuance information
- Verification data

### Center Model

- Location details
- Capacity information
- Working hours
- Available services

### Notification Model

- User-specific notifications
- Read status
- Priority and actions

## API Endpoints

The API is organized into the following main categories:

### Authentication Endpoints

- User registration
- Login/logout
- Token refresh
- OAuth flows

### Appointment Endpoints

- Submission

### Biometric Data Endpoints

- Data submission
- Verification

### Credential Endpoints

- Issuance
- Verification
- Revocation

### Center Endpoints

- Center management
- Capacity planning

### Notification Endpoints

- Sending notifications
- Reading status

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables
   Create a `.env` file based on the `.env.example` template:

```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/cpf-system
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=86400
```

4. Start the server

```bash
npm start
```

5. Access the API documentation
   Open `http://localhost:8080/api-docs` in your browser.

## Development Guidelines

### Code Structure

- **models/** - Database schemas and models
- **controllers/** - Business logic
- **routes/** - API endpoints definition
- **middlewares/** - Request processing middleware
- **config/** - Configuration files
- **utils/** - Utility functions

### Authentication Flow

1. User registers or logs in
2. Server issues JWT + refresh token
3. Client includes JWT in Authorization header
4. Server validates token on protected routes
5. Token refresh when expired

### Request Processing Flow

1. Appointment Submission

   - User creates request
   - System validates data
   - Request enters pending state

2. Officer Review

   - Officer reviews request
   - Decision made (approve/reject)
   - Notification sent to user

3. Appointment Scheduling

   - For approved requests
   - User selects available slot
   - Confirmation sent

4. Biometric Collection

   - During appointment
   - Officer collects biometric data
   - System validates quality

5. Credential Issuance
   - System generates CPF
   - Credential created and issued
   - Verification code generated

## Security Considerations

- JWT tokens with appropriate expiration
- Password hashing with bcrypt
- Role-based access control
- Rate limiting for sensitive endpoints
- Input validation and sanitization
- Secure HTTP headers with Helmet

## Monitoring and Maintenance

- Error logging
- Performance monitoring
- Database backups
- Version control

## API Documentation

Full API documentation is available via Swagger at `/api-docs` when the server is running.

## Contributing

1. Follow the established code structure
2. Maintain consistent error handling
3. Update API documentation for any changes
4. Write tests for new features
5. Adhere to the existing code style
