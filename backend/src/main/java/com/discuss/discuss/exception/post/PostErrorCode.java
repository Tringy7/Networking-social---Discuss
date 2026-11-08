package com.discuss.discuss.exception.post;

import org.springframework.http.HttpStatus;

public enum PostErrorCode {
    // 400 - Bad Request
    INVALID_MEDIA(HttpStatus.BAD_REQUEST, "Invalid post image references or upload indexes"),
    EMPTY_POST(HttpStatus.BAD_REQUEST, "Post content or media is required"),
    UNSUPPORTED_POST_TYPE(HttpStatus.BAD_REQUEST, "Only TEXT posts can be created or updated"),
    COMMUNITY_CHANGE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "A post cannot be moved to another community"),
    DUPLICATE_MEDIA(HttpStatus.BAD_REQUEST, "Duplicate media objectKey"),
    MARKDOWN_MEDIA_MISSING(HttpStatus.BAD_REQUEST, "Every Markdown image must be included in media"),
    TOO_MANY_MEDIA(HttpStatus.BAD_REQUEST, "At most 20 media items per post"),

    // 403 - Forbidden
    POST_EDIT_FORBIDDEN(HttpStatus.FORBIDDEN, "Only the author can edit this post"),

    // 404 - Not Found
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "Post not found"),

    // 415 - Unsupported Media Type
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Video upload is not available yet");

    private final HttpStatus status;
    private final String defaultMessage;

    PostErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}
