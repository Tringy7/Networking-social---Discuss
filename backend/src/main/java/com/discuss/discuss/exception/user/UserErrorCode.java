package com.discuss.discuss.exception.user;

import org.springframework.http.HttpStatus;

public enum UserErrorCode {

    // =========================
    // 400 - Bad Request
    // =========================

    INVALID_USER_STATUS(
            HttpStatus.BAD_REQUEST,
            "Invalid user status"
    ),

    INVALID_USER_ROLE(
            HttpStatus.BAD_REQUEST,
            "Invalid user role"
    ),

    // =========================
    // 404 - Not Found
    // =========================

    USER_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "User not found"
    ),

    USER_PROFILE_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "User profile not found"
    ),

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

    // =========================
    // 403 - Forbidden
    // =========================

    ACCOUNT_LOCKED(
            HttpStatus.FORBIDDEN,
            "This account has been locked"
    ),

    ACCOUNT_NOT_VERIFIED(
            HttpStatus.FORBIDDEN,
            "This account has not been verified"
    );

    private final HttpStatus status;
    private final String defaultMessage;

    UserErrorCode(
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