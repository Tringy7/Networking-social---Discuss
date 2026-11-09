package com.discuss.discuss.exception.comment;

public class CommentException extends RuntimeException {
    private final CommentErrorCode error;

    public CommentException(CommentErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public CommentException(CommentErrorCode error, String customMessage) {
        super(customMessage);
        this.error = error;
    }

    public CommentException(CommentErrorCode error, String customMessage, Throwable cause) {
        super(customMessage, cause);
        this.error = error;
    }

    public CommentErrorCode getError() { return error; }
}
