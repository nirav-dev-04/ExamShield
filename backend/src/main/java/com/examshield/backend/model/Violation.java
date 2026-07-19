package com.examshield.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "violations")
public class Violation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonIgnore
    private ExamAttempt attempt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ViolationType type;

    @Column(name = "occurred_at", insertable = false, updatable = false)
    private LocalDateTime occurredAt;

    public Violation() {}

    public Violation(Long id, ExamAttempt attempt, ViolationType type, LocalDateTime occurredAt) {
        this.id = id;
        this.attempt = attempt;
        this.type = type;
        this.occurredAt = occurredAt;
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

    public ViolationType getType() {
        return type;
    }

    public void setType(ViolationType type) {
        this.type = type;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private ExamAttempt attempt;
        private ViolationType type;
        private LocalDateTime occurredAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder attempt(ExamAttempt attempt) {
            this.attempt = attempt;
            return this;
        }

        public Builder type(ViolationType type) {
            this.type = type;
            return this;
        }

        public Builder occurredAt(LocalDateTime occurredAt) {
            this.occurredAt = occurredAt;
            return this;
        }

        public Violation build() {
            return new Violation(id, attempt, type, occurredAt);
        }
    }
}
