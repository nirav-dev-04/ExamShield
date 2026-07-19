package com.examshield.backend.exception;

public class AttemptAlreadySubmittedException extends RuntimeException {
    public AttemptAlreadySubmittedException(String message) {
        super(message);
    }
}
