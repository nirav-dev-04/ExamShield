package com.examshield.backend.exception;

import com.examshield.backend.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    @ExceptionHandler(ExamNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleExamNotFound(ExamNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "Exam Not Found", ex.getMessage());
    }

    @ExceptionHandler(AttemptAlreadySubmittedException.class)
    public ResponseEntity<ErrorResponse> handleAttemptAlreadySubmitted(AttemptAlreadySubmittedException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Attempt Already Submitted", ex.getMessage());
    }

    @ExceptionHandler(DuplicateAttemptException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateAttempt(DuplicateAttemptException ex) {
        return buildResponse(HttpStatus.CONFLICT, "Duplicate Attempt", ex.getMessage());
    }

    @ExceptionHandler(InvalidViolationException.class)
    public ResponseEntity<ErrorResponse> handleInvalidViolation(InvalidViolationException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Invalid Violation", ex.getMessage());
    }

    @ExceptionHandler(QuestionPoolLockedException.class)
    public ResponseEntity<ErrorResponse> handleQuestionPoolLocked(QuestionPoolLockedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Question Pool Locked", ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedAccess(UnauthorizedAccessException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Forbidden", ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to access this resource");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", errors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        // Log full details server-side via SLF4J
        log.error("An unexpected error occurred in the application", ex);
        // Return a generic error message to prevent database/internal details leakage
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "An unexpected error occurred on the server");
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String error, String message) {
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .message(message)
                .build();
        return new ResponseEntity<>(response, status);
    }
}
