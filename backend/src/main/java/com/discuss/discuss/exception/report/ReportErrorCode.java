package com.discuss.discuss.exception.report;

import org.springframework.http.HttpStatus;

public enum ReportErrorCode {
    INVALID_COMMUNITY_REPORT_TYPE(HttpStatus.BAD_REQUEST,
            "Community moderation only supports POST and COMMENT reports"),

    // 403 - Forbidden
    ADMIN_REQUIRED(HttpStatus.FORBIDDEN, "Only admins can view all reports"),

    // 404 - Not Found
    TARGET_NOT_FOUND(HttpStatus.NOT_FOUND, "Report target not found or unavailable"),

    // 409 - Conflict
    DUPLICATE_PENDING_REPORT(HttpStatus.CONFLICT, "You already have a pending report for this target");

    private final HttpStatus status;
    private final String defaultMessage;

    ReportErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}
