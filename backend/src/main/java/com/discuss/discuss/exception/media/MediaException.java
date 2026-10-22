package com.discuss.discuss.exception.media;

public class MediaException extends RuntimeException {

    private final MediaErrorCode error;

    public MediaException(MediaErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public MediaException(MediaErrorCode error, String customMessage) {
        super(customMessage);
        this.error = error;
    }

    public MediaException(MediaErrorCode error, String customMessage, Throwable cause) {
        super(customMessage, cause);
        this.error = error;
    }

    public MediaErrorCode getError() { return error; }
}