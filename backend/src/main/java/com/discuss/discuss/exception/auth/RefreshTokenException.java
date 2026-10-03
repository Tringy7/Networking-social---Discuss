package com.discuss.discuss.exception.auth;

public class RefreshTokenException extends RuntimeException {
    public RefreshTokenException(String message) {
        super(message);
    }
    public RefreshTokenException(String message, Throwable cause) {}
}
