# Untitled

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
  "password": "123456"
  "roles":["user"]
}
{
  "username": "faress",
  "email": "exadddd@example.com",
  "password": "123456",
  "roles": ["manager", "user"]  // This is perfectly valid
}
{
  "username": "faress",
  "email": "exadddd@example.com",
  "password": "123456",
  "roles": ["manager", "user", "officer"]  // This is also valid
}

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

## Public and Protected Content Endpoints

### 4. Public Content

**Method:** GET

**URL:** `http://localhost:8080/api/test/all`

**Headers:** None

**Request Body:** None

**Description:** Provides access to public content.

---

### 5. User Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/user`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides user-specific content.

---

### 6. Manager Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/manager`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides manager-specific content.

---

### 7. Officer Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/officer`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides officer-specific content.

---

### 8. Welcome Message

**Method:** GET

**URL:** `http://localhost:8080/`

**Headers:** None

**Request Body:** None

**Description:** Root endpoint displaying a welcome message.

---

## Notes:

- Replace `<token>` in the `Authorization` header with the actual JWT token received after logging in.
- Ensure the `Content-Type` header is set to `application/json` for endpoints that require a request body.
- Unauthorized access to protected endpoints will result in a `401 Unauthorized` response.