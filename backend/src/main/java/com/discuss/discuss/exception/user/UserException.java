package com.discuss.discuss.exception.user;

public class UserException extends RuntimeException {

    private final UserErrorCode error;

    public UserException(UserErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public UserException(UserErrorCode error, String customMessage) {
        super(customMessage);
        this.error = error;
    }

    public UserException(
            UserErrorCode error,
            String customMessage,
            Throwable cause
    ) {
        super(customMessage, cause);
        this.error = error;
    }

    public UserErrorCode getError() {
        return error;
    }
}