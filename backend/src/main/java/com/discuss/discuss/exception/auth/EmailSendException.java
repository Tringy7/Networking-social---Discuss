package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public class EmailSendException extends AuthException {

    public EmailSendException(String message, Throwable cause) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }
}