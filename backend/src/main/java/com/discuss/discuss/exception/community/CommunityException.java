package com.discuss.discuss.exception.community;

public class CommunityException extends RuntimeException {

    private final CommunityErrorCode error;

    public CommunityException(CommunityErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public CommunityException(CommunityErrorCode error, String customMessage) {
        super(customMessage);
        this.error = error;
    }

    public CommunityException(CommunityErrorCode error, String customMessage, Throwable cause) {
        super(customMessage, cause);
        this.error = error;
    }

    public CommunityErrorCode getError() {
        return error;
    }
}