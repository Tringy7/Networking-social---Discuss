package com.discuss.discuss.exception.auth;

public class AuthException extends RuntimeException {

    private final AuthErrorCode error;

    public AuthException(AuthErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public AuthException(AuthErrorCode error, String customMessage) {
        super(customMessage);
        this.error = error;
    }

    public AuthException(AuthErrorCode error, String customMessage, Throwable cause) {
        super(customMessage, cause);
        this.error = error;
    }

    public AuthErrorCode getError() {
        return error;
    }
}