package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public enum AuthErrorCode {

    // =========================
    // 409 - Conflict
    // =========================

    EMAIL_ALREADY_EXISTS(
            "AUTH_001",
            HttpStatus.CONFLICT,
            "Email already exists"
    ),

    USERNAME_ALREADY_EXISTS(
            "AUTH_002",
            HttpStatus.CONFLICT,
            "Username already exists"
    ),

    ACCOUNT_ALREADY_EXISTS(
            "AUTH_003",
            HttpStatus.CONFLICT,
            "Account already exists"
    ),


    // =========================
    // 400 - Bad Request
    // =========================

    INVALID_VERIFICATION_CODE(
            "AUTH_010",
            HttpStatus.BAD_REQUEST,
            "The verification code is incorrect or has expired"
    ),

    UNSUPPORTED_PROVIDER(
            "AUTH_011",
            HttpStatus.BAD_REQUEST,
            "Unsupported login provider"
    ),


    // =========================
    // 401 - Unauthorized
    // =========================

    INVALID_CREDENTIALS(
            "AUTH_020",
            HttpStatus.UNAUTHORIZED,
            "Invalid username or password"
    ),

    INVALID_REFRESH_TOKEN(
            "AUTH_021",
            HttpStatus.UNAUTHORIZED,
            "Invalid refresh token"
    ),

    REFRESH_TOKEN_EXPIRED(
            "AUTH_022",
            HttpStatus.UNAUTHORIZED,
            "Refresh token has expired"
    ),

    REFRESH_TOKEN_REUSED(
            "AUTH_023",
            HttpStatus.UNAUTHORIZED,
            "Refresh token reuse detected. All sessions have been revoked for security"
    ),

    REFRESH_TOKEN_MISSING(
            "AUTH_024",
            HttpStatus.UNAUTHORIZED,
            "Refresh token is missing"
    ),

    SOCIAL_VERIFICATION_FAILED(
            "AUTH_025",
            HttpStatus.UNAUTHORIZED,
            "Social login verification failed"
    ),


    // =========================
    // 403 - Forbidden
    // =========================

    ACCOUNT_NOT_VERIFIED(
            "AUTH_030",
            HttpStatus.FORBIDDEN,
            "Please verify your email before logging in"
    ),

    ACCOUNT_LOCKED(
            "AUTH_031",
            HttpStatus.FORBIDDEN,
            "This account has been locked"
    ),


    // =========================
    // 429 - Too Many Requests
    // =========================

    OTP_COOLDOWN(
            "AUTH_040",
            HttpStatus.TOO_MANY_REQUESTS,
            "Please wait before requesting a new code"
    ),


    // =========================
    // 404 - Not Found
    // =========================

    USER_NOT_FOUND(
            "AUTH_050",
            HttpStatus.NOT_FOUND,
            "User not found"
    ),


    // =========================
    // 500 - Internal Server Error
    // =========================

    EMAIL_SEND_FAILED(
            "AUTH_060",
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Failed to send email"
    );

    private final String code;
    private final HttpStatus status;
    private final String defaultMessage;

    AuthErrorCode(
            String code,
            HttpStatus status,
            String defaultMessage
    ) {
        this.code = code;
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}