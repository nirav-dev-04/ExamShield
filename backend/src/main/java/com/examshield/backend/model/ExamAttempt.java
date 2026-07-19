package com.examshield.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exam_attempts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"exam_id", "student_id"})
})
public class ExamAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false, length = 50)
    private String seed;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;

    @Column(name = "started_at", insertable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "total_score", precision = 6, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "proctor_notes", columnDefinition = "TEXT")
    private String proctorNotes;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttemptQuestion> attemptQuestions = new ArrayList<>();

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Violation> violations = new ArrayList<>();

    public ExamAttempt() {}

    public ExamAttempt(Long id, Exam exam, User student, String seed, AttemptStatus status,
                       LocalDateTime startedAt, LocalDateTime submittedAt, BigDecimal totalScore,
                       Integer rank, List<AttemptQuestion> attemptQuestions, List<Violation> violations) {
        this.id = id;
        this.exam = exam;
        this.student = student;
        this.seed = seed;
        this.status = status;
        this.startedAt = startedAt;
        this.submittedAt = submittedAt;
        this.totalScore = totalScore;
        this.rank = rank;
        if (attemptQuestions != null) this.attemptQuestions = attemptQuestions;
        if (violations != null) this.violations = violations;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public String getSeed() {
        return seed;
    }

    public void setSeed(String seed) {
        this.seed = seed;
    }

    public AttemptStatus getStatus() {
        return status;
    }

    public void setStatus(AttemptStatus status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public List<AttemptQuestion> getAttemptQuestions() {
        return attemptQuestions;
    }

    public void setAttemptQuestions(List<AttemptQuestion> attemptQuestions) {
        this.attemptQuestions = attemptQuestions;
    }

    public List<Violation> getViolations() {
        return violations;
    }

    public void setViolations(List<Violation> violations) {
        this.violations = violations;
    }

    public String getProctorNotes() {
        return proctorNotes;
    }

    public void setProctorNotes(String proctorNotes) {
        this.proctorNotes = proctorNotes;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Exam exam;
        private User student;
        private String seed;
        private AttemptStatus status = AttemptStatus.IN_PROGRESS;
        private LocalDateTime startedAt;
        private LocalDateTime submittedAt;
        private BigDecimal totalScore;
        private Integer rank;
        private List<AttemptQuestion> attemptQuestions = new ArrayList<>();
        private List<Violation> violations = new ArrayList<>();

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder exam(Exam exam) {
            this.exam = exam;
            return this;
        }

        public Builder student(User student) {
            this.student = student;
            return this;
        }

        public Builder seed(String seed) {
            this.seed = seed;
            return this;
        }

        public Builder status(AttemptStatus status) {
            this.status = status;
            return this;
        }

        public Builder startedAt(LocalDateTime startedAt) {
            this.startedAt = startedAt;
            return this;
        }

        public Builder submittedAt(LocalDateTime submittedAt) {
            this.submittedAt = submittedAt;
            return this;
        }

        public Builder totalScore(BigDecimal totalScore) {
            this.totalScore = totalScore;
            return this;
        }

        public Builder rank(Integer rank) {
            this.rank = rank;
            return this;
        }

        public Builder attemptQuestions(List<AttemptQuestion> attemptQuestions) {
            this.attemptQuestions = attemptQuestions;
            return this;
        }

        public Builder violations(List<Violation> violations) {
            this.violations = violations;
            return this;
        }

        public ExamAttempt build() {
            return new ExamAttempt(id, exam, student, seed, status, startedAt, submittedAt, totalScore, rank, attemptQuestions, violations);
        }
    }
}
