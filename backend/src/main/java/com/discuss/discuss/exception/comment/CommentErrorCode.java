package com.discuss.discuss.exception.comment;

import org.springframework.http.HttpStatus;

public enum CommentErrorCode {
    EMPTY_COMMENT(HttpStatus.BAD_REQUEST, "Comment content or image is required"),
    CONTENT_TOO_LONG(HttpStatus.BAD_REQUEST, "Comment content exceeds 10000 characters"),
    PARENT_POST_MISMATCH(HttpStatus.BAD_REQUEST, "Parent comment must belong to the same post"),
    COMMENT_EDIT_FORBIDDEN(HttpStatus.FORBIDDEN, "Only the author can edit this comment"),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Comment not found"),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "Post not found"),
    ATTACHMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Image not found");

    private final HttpStatus status;
    private final String defaultMessage;

    CommentErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}
