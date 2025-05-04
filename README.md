# Backend endpoints

## API Endpoints

# API Endpoints Documentation

## Authentication Endpoints

### 1. Sign Up

**Method:** POST

**URL:** `http://localhost:8080/api/auth/signup`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "username": "example",
  "email": "example@example.com",
  "password": "123456",
  "roles":["user"]
}
{
  "username": "faress",
  "email": "exadddd@example.com",
  "password": "123456",
  "roles": ["manager", "user"]
}// This is perfectly valid
{
  "username": "faress",
  "email": "exadddd@example.com",
  "password": "123456",
  "roles": ["manager", "user", "officer"]
}// This is also valid

"roles" not "role"
```

**Description:** Registers a new user in the system.

---

### 2. Sign In

**Method:** POST

**URL:** `http://localhost:8080/api/auth/signin`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "username": "example",
  "password": "123456"
}
```

**Description:** Logs in a user and returns a JWT token.

---

### 3. Sign Out

**Method:** POST

**URL:** `http://localhost:8080/api/auth/signout`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Logs out a user by invalidating the token.

---

### 4. Refresh Token

**Method:** POST

**URL:** `http://localhost:8080/api/auth/refreshtoken`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "refreshToken": "string"
}
```

**Description:** Refreshes an expired access token using a refresh token.

---

### 5. Google OAuth Authentication

**Method:** GET

**URL:** `http://localhost:8080/api/auth/google`

**Description:** Initiates Google OAuth authentication flow.

---

### 6. Google OAuth Callback

**Method:** GET

**URL:** `http://localhost:8080/api/auth/google/callback`

**Description:** Callback URL for Google OAuth authentication.

---

### 7. GitHub OAuth Authentication

**Method:** GET

**URL:** `http://localhost:8080/api/auth/github`

**Description:** Initiates GitHub OAuth authentication flow.

---

### 8. GitHub OAuth Callback

**Method:** GET

**URL:** `http://localhost:8080/api/auth/github/callback`

**Description:** Callback URL for GitHub OAuth authentication.

---

## Public and Protected Content Endpoints

### 9. Public Content

**Method:** GET

**URL:** `http://localhost:8080/api/test/all`

**Headers:** None

**Request Body:** None

**Description:** Provides access to public content.

---

### 10. User Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/user`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides user-specific content.

---

### 11. Manager Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/manager`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides manager-specific content.

---

### 12. Officer Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/officer`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides officer-specific content.

---

### 13. Welcome Message

**Method:** GET

**URL:** `http://localhost:8080/`

**Headers:** None

**Request Body:** None

**Description:** Root endpoint displaying a welcome message.

---

## Password Management Endpoints

### 14. Forgot Password

**Method:** POST

**URL:** `http://localhost:8080/api/password/forgot`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "email": "string"
}
```

**Description:** Sends a password reset email to the user.

---

### 15. Reset Password

**Method:** POST

**URL:** `http://localhost:8080/api/password/reset`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "token": "string",
  "password": "string"
}
```

**Description:** Resets a user's password using a reset token.

---

### 16. Change Password

**Method:** POST

**URL:** `http://localhost:8080/api/password/change`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body (JSON):**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Description:** Changes a user's password when logged in.

---

## Profile Management Endpoints

### 17. Get User Profile

**Method:** GET

**URL:** `http://localhost:8080/api/profile`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Retrieves the authenticated user's profile information.

---

### 18. Update User Profile

**Method:** PUT

**URL:** `http://localhost:8080/api/profile`

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**

```
firstName: string
lastName: string
address: string
city: string
country: string
postalCode: string
aboutMe: string
work: string
workplace: string
photo: file (optional, max 5MB, supported formats: jpg, jpeg, png, gif)
```

**Description:** Updates the authenticated user's profile information. The photo field is optional and accepts image files up to 5MB in size. Supported image formats are JPG, JPEG, PNG, and GIF.

**Response:**

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "postalCode": "string",
  "aboutMe": "string",
  "work": "string",
  "workplace": "string",
  "photo": "/uploads/filename.jpg",
  "roles": ["string"]
}
```

**Note:** The photo URL in the response will be relative to the server base URL. To access the photo, prepend the server URL to the photo path.

---

### 19. Delete User Account

**Method:** DELETE

**URL:** `http://localhost:8080/api/profile`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Deletes the authenticated user's account.

---

### 20. Link OAuth Account

**Method:** POST

**URL:** `http://localhost:8080/api/profile/link-oauth`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body (JSON):**

```json
{
  "provider": "string",
  "providerId": "string"
}
```

**Description:** Links an OAuth account to the user's profile.

---

### 21. Get Active Sessions

**Method:** GET

**URL:** `http://localhost:8080/api/profile/sessions`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Retrieves the authenticated user's active sessions.

---

### 22. Revoke Session

**Method:** DELETE

**URL:** `http://localhost:8080/api/profile/sessions/:sessionToken`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Revokes a specific session for the authenticated user.

---

## Notes:

- Replace `<token>` in the `Authorization` header with the actual JWT token received after logging in.
- Ensure the `Content-Type` header is set to `application/json` for endpoints that require a request body.
- Unauthorized access to protected endpoints will result in a `401 Unauthorized` response.
- The API includes rate limiting for login attempts (5 attempts per 15 minutes).
- CSRF protection is implemented for all routes except OAuth callbacks[this will be added later just befor production].

A robust backend API built with Node.js, Express, and MongoDB that provides authentication, user management, and profile features.

## Features

- User authentication (JWT-based)
- OAuth2 authentication (Google, GitHub)
- Profile management with photo upload
- Password reset functionality
- Session management
- Role-based authorization (User, Manager, Officer)
- CPF request and approval workflow
- Appointment scheduling and management
- Biometric data collection and verification
- Biometric deduplication with external API integration
- Fraud detection and prevention system
- Document generation for verified users
- Blocking mechanism for fraudulent users
- Rate limiting for security
- Secure cookie sessions
- Error handling middleware

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Google OAuth2 credentials (for Google login)
- GitHub OAuth credentials (for GitHub login)
- External Biometric Deduplication API access
- Document Generation API or library

## Setup Instructions

1. Clone the repository:

```bash
git clone [repository-url]
cd node-js-express-login--mongodb
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# MongoDB Configuration
DB_HOST=localhost
DB_PORT=27017
DB_NAME=your_database_name

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=86400

# Session Configuration
SESSION_SECRET=your-session-secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback

# Frontend URL for CORS
CLIENT_URL=http://localhost:4200

# Email Configuration (for password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-app-password

# Deduplication API Configuration
DEDUPLICATION_API_URL=https://api.deduplication-service.com
DEDUPLICATION_API_KEY=your-api-key
DEDUPLICATION_API_SECRET=your-api-secret

# Document Generation Configuration
DOCUMENT_TEMPLATES_PATH=./app/resources/templates
DOCUMENT_OUTPUT_PATH=./app/resources/documents
```

4. Create the uploads directory:

```bash
mkdir -p app/middlewares/uploads
```

5. Start the server:

```bash
npm start
```

## API Documentation

### Base URL

```
http://localhost:8080
```

### Authentication Headers

For protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

All responses follow this format:

```json
{
  "message": "Success/Error message",
  "data": {}, // Optional response data
  "error": {} // Optional error details
}
```

### Error Handling

Common error status codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

### Rate Limiting

- Login attempts are limited to 5 per 15 minutes per IP
- Exceeded limits will return a 429 status code

### File Upload Specifications

For photo uploads:

- Maximum file size: 5MB
- Supported formats: JPG, JPEG, PNG, GIF
- Files are stored in: `/app/middlewares/uploads`
- Access URL pattern: `/uploads/{filename}`

## Development Notes

### Security Features

- CORS enabled with configurable origin
- Helmet.js for security headers
- Rate limiting on sensitive endpoints
- Secure cookie sessions
- Password hashing with bcrypt
- JWT token authentication
- File upload validation

### Database Schema

**User Model:**

```javascript
{
  username: String,
  email: String,
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  provider: {
    type: String,
    enum: ["local", "google", "github"],
    default: "local"
  },
  googleId: String,
  githubId: String,
  firstName: String,
  lastName: String,
  address: String,
  city: String,
  country: String,
  postalCode: String,
  aboutMe: String,
  work: String,
  workplace: String,
  photo: String,
  activeSessions: [{
    token: String,
    device: String,
    lastActive: Date,
    ipAddress: String
  }],
  roles: [{
    type: ObjectId,
    ref: "Role"
  }]
}
```

**Role Model:**

```javascript
{
  name: String; // "user", "manager", "officer"
}
```

### OAuth Flow

1. Frontend redirects to:

   - Google: `/api/auth/google`
   - GitHub: `/api/auth/github`

2. User authenticates with provider

3. Provider redirects to callback URL:

   - Google: `/api/auth/google/callback`
   - GitHub: `/api/auth/github/callback`

4. Backend creates/updates user and returns JWT

### Testing the API

You can use tools like Postman or curl to test the API. Example curl commands:

```bash
# Login
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"example","password":"123456"}'

# Update Profile with Photo
curl -X PUT http://localhost:8080/api/profile \
  -H "Authorization: Bearer <your-token>" \
  -F "photo=@/path/to/photo.jpg" \
  -F "firstName=John" \
  -F "lastName=Doe"
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License.
