package com.discuss.discuss.exception.chat;

import org.springframework.http.HttpStatus;

public enum ChatErrorCode {
    ATTACHMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Attachment not found"),
    ATTACHMENT_READ_FAILED(HttpStatus.BAD_REQUEST, "Could not read attachment"),
    CANNOT_BLOCK_SELF(HttpStatus.BAD_REQUEST, "Cannot block yourself"),
    CANNOT_MESSAGE_SELF(HttpStatus.BAD_REQUEST, "Cannot message yourself"),
    CONVERSATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Conversation not found"),
    DUPLICATE_CHAT_REQUEST(HttpStatus.CONFLICT, "A chat request already exists"),
    EMPTY_MESSAGE(HttpStatus.BAD_REQUEST, "Message is empty"),
    INVALID_ATTACHMENTS(HttpStatus.BAD_REQUEST, "Attach up to four files of 10 MB each"),
    MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "Message not found"),
    MESSAGE_OWNER_REQUIRED(HttpStatus.FORBIDDEN, "Message belongs to another user"),
    MESSAGE_UNAVAILABLE(HttpStatus.CONFLICT, "Message is unavailable"),
    MESSAGING_UNAVAILABLE(HttpStatus.FORBIDDEN, "Messaging unavailable"),
    PARTICIPANT_NOT_FOUND(HttpStatus.NOT_FOUND, "Active chat participant not found"),
    RATE_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "Chat rate limit exceeded"),
    REQUEST_ACTION_FORBIDDEN(HttpStatus.FORBIDDEN, "Cannot perform this request action"),
    REQUEST_NOT_ACCEPTED(HttpStatus.CONFLICT, "Chat request must be accepted"),
    REQUEST_NOT_PENDING(HttpStatus.CONFLICT, "Chat request is no longer pending"),
    REQUEST_REQUIRED_TO_SEND(HttpStatus.CONFLICT, "Chat request must be accepted before sending messages"),
    TOO_MANY_CONNECTIONS(HttpStatus.TOO_MANY_REQUESTS, "Too many chat connections"),
    UNSUPPORTED_REACTION(HttpStatus.BAD_REQUEST, "Unsupported message reaction");

    private final HttpStatus status;
    private final String defaultMessage;

    ChatErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}
