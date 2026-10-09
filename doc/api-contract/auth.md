# Auth API Contract

Base path: `/auth`

This contract is derived from `AuthController` and its DTOs.

## Common conventions

- All auth endpoints are under `/auth`.
- Successful login/register/social login/refresh operations set authentication cookies in the response headers.
- Cookie names used by the backend:
  - `access_token`
  - `refresh_token`
  - `reset_password_token`
- `access_token` and `refresh_token` are `HttpOnly` cookies and are used for session authentication.
- `reset_password_token` is issued for password reset flows and is cleared after successful reset.
- Most endpoints return either:
  - `AuthResponseDTO` when returning user data
  - `ApiResponse` when returning a simple status message

## Response envelope shapes

### `AuthResponseDTO`

```json
{
  "message": "string",
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER | ADMIN | ...",
    "status": "ACTIVE | ...",
    "createdAt": "2025-01-01T12:00:00"
  }
}
```

Notes:
- `data` is omitted when null.
- `role` and `status` are enum values defined by the backend.

### `ApiResponse`

```json
{
  "message": "string"
}
```

## Authentication cookies

### Set-cookie headers on auth success

```http
Set-Cookie: access_token=<jwt>; HttpOnly; Path=/; Secure; SameSite=Lax
Set-Cookie: refresh_token=<jwt>; HttpOnly; Path=/auth; Secure; SameSite=Lax
```

### Password reset cookie

```http
Set-Cookie: reset_password_token=<token>; HttpOnly; Path=/auth/forgot-password/reset; Secure; SameSite=Strict
```

## Endpoints

### 1) Register user

`POST /auth/register`

Request body:

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

Validation rules:
- `username`: required, 3-30 chars, allowed chars: letters, numbers, underscore
- `email`: required, valid email format
- `password`: required, minimum 8 chars
- `confirmPassword`: required and must match `password`

Success response:
- Status: `201 Created`
- Body: `AuthResponseDTO`

Example:

```json
{
  "message": "Registration successful",
  "data": {
    "id": "abc123",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T12:00:00"
  }
}
```

---

### 2) Verify email

`POST /auth/verify-email`

Request body:

```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

Success response:
- Status: `200 OK`
- Body: `AuthResponseDTO`
- Also sets auth cookies (`access_token`, `refresh_token`)

---

### 3) Resend OTP

`POST /auth/resend-otp`

Request body:

```json
{
  "email": "john@example.com"
}
```

Validation rules:
- `email`: required, valid email format

Success response:
- Status: `200 OK`
- Body:

```json
{
  "message": "Verification code has been sent"
}
```

---

### 4) Refresh access token

`POST /auth/refresh`

Request:
- Reads `refresh_token` from cookie

Cookie requirement:

```http
Cookie: refresh_token=<jwt>
```

Success response:
- Status: `200 OK`
- Body:

```json
{
  "message": "Token refreshed successfully"
}
```

Response headers:
- Sets new `access_token` cookie
- Sets new `refresh_token` cookie

Error conditions:
- Missing or invalid refresh token => unauthorized error

---

### 5) Social login

`POST /auth/social/{provider}`

Path parameter:
- `provider`: the configured social auth provider key

Request body:

```json
{
  "token": "social-provider-token"
}
```

Validation rules:
- `token`: required, non-blank

Success response:
- Status: `200 OK`
- Body: `AuthResponseDTO`
- Sets auth cookies

Example:

```json
{
  "message": "Login with google successful",
  "data": {
    "id": "abc123",
    "username": "googleuser",
    "email": "user@gmail.com",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T12:00:00"
  }
}
```

---

### 6) Login with username/password

`POST /auth/login`

Request body:

```json
{
  "username": "johndoe",
  "password": "Password123"
}
```

Validation rules:
- `username`: required, 3-30 chars, allowed chars: letters, numbers, underscore
- `password`: required, minimum 8 chars

Success response:
- Status: `200 OK`
- Body: `AuthResponseDTO`
- Sets auth cookies

Example:

```json
{
  "message": "Login successfully",
  "data": {
    "id": "abc123",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T12:00:00"
  }
}
```

---

### 7) Forgot password request

`POST /auth/forgot-password`

Request body:

```json
{
  "email": "john@example.com"
}
```

Validation rules:
- `email`: required, valid email format

Success response:
- Status: `201 Created`
- Body:

```json
{
  "message": "Forgot password has been sent"
}
```

---

### 8) Verify forgot-password code

`POST /auth/forgot-password/verify`

Request body:

```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

Success response:
- Status: `200 OK`
- Body:

```json
{
  "message": "Email verification successful. You can now reset your password."
}
```

Response headers:
- Sets `reset_password_token` cookie for the reset flow

---

### 9) Reset password

`POST /auth/forgot-password/reset`

Request:
- Reads `reset_password_token` cookie
- JSON body contains new password and confirmation

Cookie requirement:

```http
Cookie: reset_password_token=<token>
```

Request body:

```json
{
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

Validation rules:
- `password`: required, minimum 8 chars
- `confirmPassword`: required and must match `password`

Success response:
- Status: `200 OK`
- Body:

```json
{
  "message": "Password has been reset successfully"
}
```

Response headers:
- Clears the `reset_password_token` cookie

---

### 10) Change password

`PATCH /auth/change-password`

Request body:

```json
{
  "oldPassword": "OldPassword123",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

Validation rules:
- `oldPassword`: required
- `password`: required, minimum 8 chars
- `confirmPassword`: required and must match `password`

Success response:
- Status: `200 OK`
- Body:

```json
{
  "message": "Password changed successfully"
}
```

---

### 11) Logout

`POST /auth/logout`

Request:
- No request body required

Success response:
- Status: `200 OK`
- Body:

```json
{
  "message": "Logout successfully"
}
```

Response headers:
- Clears `access_token` cookie at `/`
- Clears `refresh_token` cookie at `/auth`

## Notes

- The controller relies on `@Valid` for request validation on all DTOs that declare bean validation constraints.
- `VerifyEmailRequestDTO` is used for both email verification and forgot-password verification, but the controller expects it to carry `email` and `code` values.
- `AuthController` does not declare a global standardized error response contract in this file; error payloads depend on the project’s exception handling configuration.
