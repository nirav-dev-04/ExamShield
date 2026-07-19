package com.examshield.backend.exception;

public class InvalidViolationException extends RuntimeException {
    public InvalidViolationException(String message) {
        super(message);
    }
}
