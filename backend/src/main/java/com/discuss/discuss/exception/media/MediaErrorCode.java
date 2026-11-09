package com.discuss.discuss.exception.media;

import org.springframework.http.HttpStatus;

public enum MediaErrorCode {

    // 400 - Bad Request
    EMPTY_FILE(HttpStatus.BAD_REQUEST, "The uploaded file is empty"),
    INVALID_IMAGE(HttpStatus.BAD_REQUEST, "The file is not a valid or readable image"),
    UNSUPPORTED_IMAGE_FORMAT(HttpStatus.BAD_REQUEST, "Only JPEG, PNG and WebP images are supported"),
    TOO_MANY_FILES(HttpStatus.BAD_REQUEST, "Too many files in a single request"),
    INVALID_OBJECT_KEY(HttpStatus.BAD_REQUEST, "Invalid media object key"),

    // 413 - Payload Too Large
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "The file exceeds the maximum allowed size"),
    IMAGE_RESOLUTION_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "The image resolution is too large"),

    // 403 - Forbidden
    MEDIA_ACCESS_DENIED(HttpStatus.FORBIDDEN, "You do not have permission to access this media"),

    // 404 - Not Found
    MEDIA_NOT_FOUND(HttpStatus.NOT_FOUND, "Media not found"),

    // 500 - Internal Server Error
    IMAGE_PROCESSING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process the image"),
    STORAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload the file to storage"),
    STORAGE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete the file from storage"),
    STORAGE_READ_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read the file from storage");

    private final HttpStatus status;
    private final String defaultMessage;

    MediaErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}