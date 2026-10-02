package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public class UnsupportedProviderException extends AuthException {

    public UnsupportedProviderException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}