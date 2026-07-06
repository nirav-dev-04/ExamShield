package com.examshield.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ExamAttemptResponseDTO {
    private Long id;
    private Long examId;
    private String examTitle;
    private String studentName;
    private String status;
    private LocalDateTime startedAt;
    private Integer durationMinutes;
    private Long remainingSeconds;
    private List<QuestionResponseDTO> questions;
    private Integer violationsCount;

    public ExamAttemptResponseDTO() {}

    public ExamAttemptResponseDTO(Long id, Long examId, String examTitle, String studentName, String status,
                                  LocalDateTime startedAt, Integer durationMinutes, Long remainingSeconds,
                                  List<QuestionResponseDTO> questions, Integer violationsCount) {
        this.id = id;
        this.examId = examId;
        this.examTitle = examTitle;
        this.studentName = studentName;
        this.status = status;
        this.startedAt = startedAt;
        this.durationMinutes = durationMinutes;
        this.remainingSeconds = remainingSeconds;
        this.questions = questions;
        this.violationsCount = violationsCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public String getExamTitle() {
        return examTitle;
    }

    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Long getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(Long remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public List<QuestionResponseDTO> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionResponseDTO> questions) {
        this.questions = questions;
    }

    public Integer getViolationsCount() {
        return violationsCount;
    }

    public void setViolationsCount(Integer violationsCount) {
        this.violationsCount = violationsCount;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long examId;
        private String examTitle;
        private String studentName;
        private String status;
        private LocalDateTime startedAt;
        private Integer durationMinutes;
        private Long remainingSeconds;
        private List<QuestionResponseDTO> questions;
        private Integer violationsCount;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder examId(Long examId) {
            this.examId = examId;
            return this;
        }

        public Builder examTitle(String examTitle) {
            this.examTitle = examTitle;
            return this;
        }

        public Builder studentName(String studentName) {
            this.studentName = studentName;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder startedAt(LocalDateTime startedAt) {
            this.startedAt = startedAt;
            return this;
        }

        public Builder durationMinutes(Integer durationMinutes) {
            this.durationMinutes = durationMinutes;
            return this;
        }

        public Builder remainingSeconds(Long remainingSeconds) {
            this.remainingSeconds = remainingSeconds;
            return this;
        }

        public Builder questions(List<QuestionResponseDTO> questions) {
            this.questions = questions;
            return this;
        }

        public Builder violationsCount(Integer violationsCount) {
            this.violationsCount = violationsCount;
            return this;
        }

        public ExamAttemptResponseDTO build() {
            return new ExamAttemptResponseDTO(id, examId, examTitle, studentName, status, startedAt, durationMinutes, remainingSeconds, questions, violationsCount);
        }
    }
}
