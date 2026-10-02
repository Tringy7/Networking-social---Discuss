package com.discuss.discuss.exception.auth;

import org.springframework.http.HttpStatus;

public class UsernameAlreadyExistsException extends AuthException {

    public UsernameAlreadyExistsException(String username) {
        super("Username already exists: " + username, HttpStatus.CONFLICT);
    }
}