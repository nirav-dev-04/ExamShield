package com.examshield.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "exam_sections")
public class ExamSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonIgnore
    private Exam exam;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    public ExamSection() {}

    public ExamSection(Long id, Exam exam, String name, Integer questionCount, Integer durationMinutes) {
        this.id = id;
        this.exam = exam;
        this.name = name;
        this.questionCount = questionCount;
        this.durationMinutes = durationMinutes;
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

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Exam exam;
        private String name;
        private Integer questionCount;
        private Integer durationMinutes;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder exam(Exam exam) {
            this.exam = exam;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder questionCount(Integer questionCount) {
            this.questionCount = questionCount;
            return this;
        }

        public Builder durationMinutes(Integer durationMinutes) {
            this.durationMinutes = durationMinutes;
            return this;
        }

        public ExamSection build() {
            return new ExamSection(id, exam, name, questionCount, durationMinutes);
        }
    }
}
