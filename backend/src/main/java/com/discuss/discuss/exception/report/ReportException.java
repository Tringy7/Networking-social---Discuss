package com.discuss.discuss.exception.report;

public class ReportException extends RuntimeException {
    private final ReportErrorCode error;

    public ReportException(ReportErrorCode error) {
        super(error.getDefaultMessage());
        this.error = error;
    }

    public ReportException(ReportErrorCode error, String customMessage) {
        super(customMessage);
        this.error = error;
    }

    public ReportException(ReportErrorCode error, String customMessage, Throwable cause) {
        super(customMessage, cause);
        this.error = error;
    }

    public ReportErrorCode getError() { return error; }
}
