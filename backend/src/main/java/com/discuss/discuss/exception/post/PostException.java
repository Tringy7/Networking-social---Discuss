package com.discuss.discuss.exception.post;

public class PostException extends RuntimeException {
    private final PostErrorCode error;

    public PostException(PostErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public PostException(PostErrorCode error, String customMessage) {
        super(customMessage);
        this.error = error;
    }

    public PostException(PostErrorCode error, String customMessage, Throwable cause) {
        super(customMessage, cause);
        this.error = error;
    }

    public PostErrorCode getError() { return error; }
}
