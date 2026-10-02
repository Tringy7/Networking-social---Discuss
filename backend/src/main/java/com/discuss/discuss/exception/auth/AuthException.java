package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public abstract class AuthException extends RuntimeException {

    private final HttpStatus status;

    protected AuthException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    protected AuthException(String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}