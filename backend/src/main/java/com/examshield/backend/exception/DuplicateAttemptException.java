package com.examshield.backend.exception;

public class DuplicateAttemptException extends RuntimeException {
    public DuplicateAttemptException(String message) {
        super(message);
    }
}
