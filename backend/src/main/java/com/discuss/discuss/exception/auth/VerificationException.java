package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public class VerificationException extends AuthException {

    public VerificationException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }

    public VerificationException(String message, Throwable cause) {
        super(message, HttpStatus.UNAUTHORIZED, cause);
    }
}