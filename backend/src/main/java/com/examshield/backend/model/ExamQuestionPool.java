package com.examshield.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "exam_question_pool")
public class ExamQuestionPool {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private ExamSection section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    public ExamQuestionPool() {}

    public ExamQuestionPool(Long id, Exam exam, ExamSection section, Question question) {
        this.id = id;
        this.exam = exam;
        this.section = section;
        this.question = question;
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

    public ExamSection getSection() {
        return section;
    }

    public void setSection(ExamSection section) {
        this.section = section;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Exam exam;
        private ExamSection section;
        private Question question;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder exam(Exam exam) {
            this.exam = exam;
            return this;
        }

        public Builder section(ExamSection section) {
            this.section = section;
            return this;
        }

        public Builder question(Question question) {
            this.question = question;
            return this;
        }

        public ExamQuestionPool build() {
            return new ExamQuestionPool(id, exam, section, question);
        }
    }
}
