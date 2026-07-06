package com.examshield.backend.exception;

public class QuestionPoolLockedException extends RuntimeException {
    public QuestionPoolLockedException(String message) {
        super(message);
    }
}
