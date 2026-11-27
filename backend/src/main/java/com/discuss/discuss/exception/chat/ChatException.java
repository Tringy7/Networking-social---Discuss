package com.discuss.discuss.exception.chat;

public class ChatException extends RuntimeException {
    private final ChatErrorCode error;

    public ChatException(ChatErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public ChatException(ChatErrorCode error, Throwable cause) {
        super(error.getDefaultMessage(), cause);
        this.error = error;
    }

    public ChatErrorCode getError() { return error; }
}
