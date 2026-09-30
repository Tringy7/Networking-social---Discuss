package com.discuss.discuss.exception.auth;

public class UserNotExistException extends RuntimeException {
    public UserNotExistException(String email) {
        super("Email not exists: " + email);
    }
}
