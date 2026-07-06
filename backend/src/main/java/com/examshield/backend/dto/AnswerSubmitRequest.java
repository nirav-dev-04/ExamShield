package com.examshield.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AnswerSubmitRequest {
    @NotNull(message = "Question ID is required")
    private Long questionId;

    @NotBlank(message = "Answer cannot be blank")
    private String studentAnswer;

    public AnswerSubmitRequest() {}

    public AnswerSubmitRequest(Long questionId, String studentAnswer) {
        this.questionId = questionId;
        this.studentAnswer = studentAnswer;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getStudentAnswer() {
        return studentAnswer;
    }

    public void setStudentAnswer(String studentAnswer) {
        this.studentAnswer = studentAnswer;
    }
}
