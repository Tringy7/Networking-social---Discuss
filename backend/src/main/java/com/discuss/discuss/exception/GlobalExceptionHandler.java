package com.discuss.discuss.exception;

import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.comment.CommentException;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.exception.media.MediaException;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.exception.report.ReportException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(CommentException.class)
    public ResponseEntity<Map<String, Object>> handleCommentException(
            CommentException ex) {
        log.warn("[COMMENT] error={}, status={}, message={}",
                ex.getError().name(), ex.getError().getStatus().value(), ex.getMessage());
        return ResponseEntity.status(ex.getError().getStatus())
                .body(Map.of("status", ex.getError().getStatus().value(), "message", ex.getMessage()));
    }


    @ExceptionHandler({jakarta.validation.ConstraintViolationException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
            org.springframework.web.method.annotation.HandlerMethodValidationException.class})
    public ResponseEntity<Map<String, Object>> handleInvalidParameter(Exception ex) {
        return ResponseEntity.badRequest().body(Map.of("status", 400, "message", "Invalid request parameter"));
    }

    @ExceptionHandler(ReportException.class)
    public ResponseEntity<Map<String, Object>> handleReportException(ReportException ex) {
        log.warn("[REPORT] error={}, status={}, message={}",
                ex.getError().name(), ex.getError().getStatus().value(), ex.getMessage());
        return ResponseEntity.status(ex.getError().getStatus())
                .body(Map.of("status", ex.getError().getStatus().value(), "message", ex.getMessage()));
    }

    @ExceptionHandler(PostException.class)
    public ResponseEntity<Map<String, Object>> handlePostException(PostException ex) {
        log.warn("[POST] error={}, status={}, message={}",
                ex.getError().name(), ex.getError().getStatus().value(), ex.getMessage());
        return ResponseEntity.status(ex.getError().getStatus())
                .body(Map.of("status", ex.getError().getStatus().value(), "message", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("status", 403, "message", ex.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidJson(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("status", 400, "message", "Invalid JSON request body"));
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, Object>> handleAuthException(AuthException ex) {

        log.warn(
                "[AUTH] error={}, status={}, message={}",
                ex.getError().name(),
                ex.getError().getStatus().value(),
                ex.getMessage()
        );

        return ResponseEntity
                .status(ex.getError().getStatus())
                .body(Map.of(
                        "status", ex.getError().getStatus().value(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(CommunityException.class)
    public ResponseEntity<Map<String, Object>> handleCommunityException(CommunityException ex) {

        log.warn(
                "[COMMUNITY] error={}, status={}, message={}",
                ex.getError().name(),
                ex.getError().getStatus().value(),
                ex.getMessage()
        );

        return ResponseEntity
                .status(ex.getError().getStatus())
                .body(Map.of(
                        "status", ex.getError().getStatus().value(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(UserException.class)
    public ResponseEntity<Map<String, Object>> handleUserException(
            UserException ex
    ) {

        log.warn(
                "[USER] error={}, status={}, message={}",
                ex.getError().name(),
                ex.getError().getStatus().value(),
                ex.getMessage()
        );

        return ResponseEntity
                .status(ex.getError().getStatus())
                .body(Map.of(
                        "status", ex.getError().getStatus().value(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex
    ) {

        Map<String, String> errors = new HashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(
                    error.getField(),
                    error.getDefaultMessage()
            );
        }

        return ResponseEntity
                .badRequest()
                .body(Map.of(
                        "status", HttpStatus.BAD_REQUEST.value(),
                        "message", "Request validation failed",
                        "errors", errors
                ));
    }

    @ExceptionHandler(MediaException.class)
    public ResponseEntity<Map<String, Object>> handleMediaException(MediaException ex) {

        if (ex.getError().getStatus().is5xxServerError()) {
            log.error(
                    "[MEDIA] error={}, status={}, message={}",
                    ex.getError().name(),
                    ex.getError().getStatus().value(),
                    ex.getMessage(),
                    ex
            );
        } else {
            log.warn(
                    "[MEDIA] error={}, status={}, message={}",
                    ex.getError().name(),
                    ex.getError().getStatus().value(),
                    ex.getMessage()
            );
        }

        return ResponseEntity
                .status(ex.getError().getStatus())
                .body(Map.of(
                        "status", ex.getError().getStatus().value(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {

        log.warn("[MEDIA] Upload exceeds multipart limit: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of(
                        "status", HttpStatus.PAYLOAD_TOO_LARGE.value(),
                        "message", "The file exceeds the maximum allowed size"
                ));
    }

    @ExceptionHandler({
            MissingServletRequestPartException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<Map<String, Object>> handleMissingRequestData(Exception ex) {

        log.warn("[MEDIA] Missing request data: {}", ex.getMessage());

        return ResponseEntity
                .badRequest()
                .body(Map.of(
                        "status", HttpStatus.BAD_REQUEST.value(),
                        "message", "Missing required request data"
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception ex
    ) {

        log.error("[SYSTEM] Unexpected error", ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "message", "Internal server error"
                ));
    }
}
