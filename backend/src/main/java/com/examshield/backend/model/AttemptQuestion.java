package com.examshield.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "attempt_questions")
public class AttemptQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonIgnore
    private ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    @Column(name = "student_answer", columnDefinition = "TEXT")
    private String studentAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "marks_awarded", precision = 5, scale = 2)
    private BigDecimal marksAwarded;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by")
    private User gradedBy;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    public AttemptQuestion() {}

    public AttemptQuestion(Long id, ExamAttempt attempt, Question question, Integer sequenceOrder,
                           String studentAnswer, Boolean isCorrect, BigDecimal marksAwarded,
                           User gradedBy, LocalDateTime gradedAt) {
        this.id = id;
        this.attempt = attempt;
        this.question = question;
        this.sequenceOrder = sequenceOrder;
        this.studentAnswer = studentAnswer;
        this.isCorrect = isCorrect;
        this.marksAwarded = marksAwarded;
        this.gradedBy = gradedBy;
        this.gradedAt = gradedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ExamAttempt getAttempt() {
        return attempt;
    }

    public void setAttempt(ExamAttempt attempt) {
        this.attempt = attempt;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public String getStudentAnswer() {
        return studentAnswer;
    }

    public void setStudentAnswer(String studentAnswer) {
        this.studentAnswer = studentAnswer;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }

    public BigDecimal getMarksAwarded() {
        return marksAwarded;
    }

    public void setMarksAwarded(BigDecimal marksAwarded) {
        this.marksAwarded = marksAwarded;
    }

    public User getGradedBy() {
        return gradedBy;
    }

    public void setGradedBy(User gradedBy) {
        this.gradedBy = gradedBy;
    }

    public LocalDateTime getGradedAt() {
        return gradedAt;
    }

    public void setGradedAt(LocalDateTime gradedAt) {
        this.gradedAt = gradedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private ExamAttempt attempt;
        private Question question;
        private Integer sequenceOrder;
        private String studentAnswer;
        private Boolean isCorrect;
        private BigDecimal marksAwarded;
        private User gradedBy;
        private LocalDateTime gradedAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder attempt(ExamAttempt attempt) {
            this.attempt = attempt;
            return this;
        }

        public Builder question(Question question) {
            this.question = question;
            return this;
        }

        public Builder sequenceOrder(Integer sequenceOrder) {
            this.sequenceOrder = sequenceOrder;
            return this;
        }

        public Builder studentAnswer(String studentAnswer) {
            this.studentAnswer = studentAnswer;
            return this;
        }

        public Builder isCorrect(Boolean isCorrect) {
            this.isCorrect = isCorrect;
            return this;
        }

        public Builder marksAwarded(BigDecimal marksAwarded) {
            this.marksAwarded = marksAwarded;
            return this;
        }

        public Builder gradedBy(User gradedBy) {
            this.gradedBy = gradedBy;
            return this;
        }

        public Builder gradedAt(LocalDateTime gradedAt) {
            this.gradedAt = gradedAt;
            return this;
        }

        public AttemptQuestion build() {
            return new AttemptQuestion(id, attempt, question, sequenceOrder, studentAnswer, isCorrect, marksAwarded, gradedBy, gradedAt);
        }
    }
}
