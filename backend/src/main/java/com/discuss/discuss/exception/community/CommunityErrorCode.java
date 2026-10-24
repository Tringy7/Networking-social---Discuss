package com.discuss.discuss.exception.community;

import org.springframework.http.HttpStatus;

public enum CommunityErrorCode {

    // =========================
    // 400 - Bad Request
    // =========================

    COMMUNITY_NAME_RESERVED(
            HttpStatus.BAD_REQUEST,
            "This community name is reserved"
    ),

    OWNER_CANNOT_LEAVE(
            HttpStatus.BAD_REQUEST,
            "The owner must transfer ownership before leaving the community"
    ),

    INVALID_ROLE_CHANGE(
            HttpStatus.BAD_REQUEST,
            "This role change is not allowed"
    ),

    // =========================
    // 403 - Forbidden
    // =========================

    FORBIDDEN(
            HttpStatus.FORBIDDEN,
            "You do not have permission to perform this action"
    ),

    COMMUNITY_PRIVATE(
            HttpStatus.FORBIDDEN,
            "This community is private"
    ),

    MEMBER_BANNED(
            HttpStatus.FORBIDDEN,
            "You are banned from this community"
    ),

    MEMBER_KICKED(
            HttpStatus.FORBIDDEN,
            "You were removed from this community and cannot rejoin"
    ),

    // =========================
    // 404 - Not Found
    // =========================

    COMMUNITY_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "Community not found"
    ),

    COMMUNITY_INFORMATION_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "Community information not found"
    ),

    CATEGORY_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "Category not found"
    ),

    MEMBER_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "Member not found in this community"
    ),

    // =========================
    // 409 - Conflict
    // =========================

    COMMUNITY_NAME_TAKEN(
            HttpStatus.CONFLICT,
            "Community name already exists"
    ),

    ALREADY_MEMBER(
            HttpStatus.CONFLICT,
            "You are already a member of this community"
    ),

    NOT_A_MEMBER(
            HttpStatus.CONFLICT,
            "You are not a member of this community"
    ),

    COMMUNITY_LIMIT_REACHED(
            HttpStatus.CONFLICT,
            "You have reached the maximum number of communities you can create"
    );

    private final HttpStatus status;
    private final String defaultMessage;

    CommunityErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}