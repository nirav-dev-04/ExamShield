package com.examshield.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ExamSectionDto {
    @NotBlank(message = "Section name is required")
    private String name;

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Section must have at least 1 question")
    private Integer questionCount;

    private Integer durationMinutes;

    public ExamSectionDto() {}

    public ExamSectionDto(String name, Integer questionCount, Integer durationMinutes) {
        this.name = name;
        this.questionCount = questionCount;
        this.durationMinutes = durationMinutes;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getQuestionCount() {
        return questionCount;
    }

    public void setQuestionCount(Integer questionCount) {
        this.questionCount = questionCount;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}
