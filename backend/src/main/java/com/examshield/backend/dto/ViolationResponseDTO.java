package com.examshield.backend.dto;

import java.time.LocalDateTime;

public class ViolationResponseDTO {
    private Long id;
    private String studentName;
    private String enrollmentNo;
    private String type;
    private LocalDateTime occurredAt;
    private Long attemptId;
    private Long examId;

    public ViolationResponseDTO() {}

    public ViolationResponseDTO(Long id, String studentName, String enrollmentNo, String type,
                                LocalDateTime occurredAt, Long attemptId, Long examId) {
        this.id = id;
        this.studentName = studentName;
        this.enrollmentNo = enrollmentNo;
        this.type = type;
        this.occurredAt = occurredAt;
        this.attemptId = attemptId;
        this.examId = examId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getEnrollmentNo() {
        return enrollmentNo;
    }

    public void setEnrollmentNo(String enrollmentNo) {
        this.enrollmentNo = enrollmentNo;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String studentName;
        private String enrollmentNo;
        private String type;
        private LocalDateTime occurredAt;
        private Long attemptId;
        private Long examId;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder studentName(String studentName) {
            this.studentName = studentName;
            return this;
        }

        public Builder enrollmentNo(String enrollmentNo) {
            this.enrollmentNo = enrollmentNo;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder occurredAt(LocalDateTime occurredAt) {
            this.occurredAt = occurredAt;
            return this;
        }

        public Builder attemptId(Long attemptId) {
            this.attemptId = attemptId;
            return this;
        }

        public Builder examId(Long examId) {
            this.examId = examId;
            return this;
        }

        public ViolationResponseDTO build() {
            return new ViolationResponseDTO(id, studentName, enrollmentNo, type, occurredAt, attemptId, examId);
        }
    }
}
