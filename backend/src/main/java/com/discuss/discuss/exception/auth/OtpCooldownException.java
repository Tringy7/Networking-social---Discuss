package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public class OtpCooldownException extends AuthException {

    public OtpCooldownException(String message) {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
    }
}