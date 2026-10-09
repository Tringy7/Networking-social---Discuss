package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public enum AuthErrorCode {

    // =========================
    // 409 - Conflict
    // =========================

    EMAIL_ALREADY_EXISTS(
            HttpStatus.CONFLICT,
            "Email already exists"
    ),

    USERNAME_ALREADY_EXISTS(
            HttpStatus.CONFLICT,
            "Username already exists"
    ),

    ACCOUNT_ALREADY_EXISTS(
            HttpStatus.CONFLICT,
            "Account already exists"
    ),

    // =========================
    // 400 - Bad Request
    // =========================

    INVALID_VERIFICATION_CODE(
            HttpStatus.BAD_REQUEST,
            "The verification code is incorrect or has expired"
    ),

    UNSUPPORTED_PROVIDER(
            HttpStatus.BAD_REQUEST,
            "Unsupported login provider"
    ),

    PASSWORD_UNCHANGED(
            HttpStatus.BAD_REQUEST,
            "The new password must be different from the current password"
    ),

    // =========================
    // 401 - Unauthorized
    // =========================

    INVALID_CREDENTIALS(
            HttpStatus.UNAUTHORIZED,
            "Invalid username or password"
    ),

    INVALID_REFRESH_TOKEN(
            HttpStatus.UNAUTHORIZED,
            "Invalid refresh token"
    ),

    INVALID_RESET_TOKEN (
            HttpStatus.UNAUTHORIZED,
            "Invalid reset password token"
    ),

    REFRESH_TOKEN_EXPIRED(
            HttpStatus.UNAUTHORIZED,
            "Refresh token has expired"
    ),

    REFRESH_TOKEN_REUSED(
            HttpStatus.UNAUTHORIZED,
            "Refresh token reuse detected. All sessions have been revoked for security"
    ),

    REFRESH_TOKEN_MISSING(
            HttpStatus.UNAUTHORIZED,
            "Refresh token is missing"
    ),

    SOCIAL_VERIFICATION_FAILED(
            HttpStatus.UNAUTHORIZED,
            "Social login verification failed"
    ),

    // =========================
    // 403 - Forbidden
    // =========================

    ACCOUNT_NOT_VERIFIED(
            HttpStatus.FORBIDDEN,
            "Please verify your email before logging in"
    ),

    ACCOUNT_LOCKED(
            HttpStatus.FORBIDDEN,
            "This account has been locked"
    ),

    // =========================
    // 429 - Too Many Requests
    // =========================

    OTP_COOLDOWN(
            HttpStatus.TOO_MANY_REQUESTS,
            "Please wait before requesting a new code"
    ),

    OTP_TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS,
            "Too many incorrect attempts. Please request a new code"),

    // =========================
    // 404 - Not Found
    // =========================

    USER_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "User not found"
    ),

    // =========================
    // 500 - Internal Server Error
    // =========================

    EMAIL_SEND_FAILED(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Failed to send email"
    );

    private final HttpStatus status;
    private final String defaultMessage;

    AuthErrorCode(
            HttpStatus status,
            String defaultMessage
    ) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}