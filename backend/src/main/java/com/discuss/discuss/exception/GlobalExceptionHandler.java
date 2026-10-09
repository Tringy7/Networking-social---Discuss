package com.discuss.discuss.exception;

import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.user.UserException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

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
                        "message", "Validation failed",
                        "errors", errors
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