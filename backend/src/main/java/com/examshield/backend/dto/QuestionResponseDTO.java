package com.examshield.backend.dto;

import com.examshield.backend.model.Difficulty;
import com.examshield.backend.model.QuestionType;

public class QuestionResponseDTO {
    private Long id;
    private Long topicId;
    private String topicName;
    private QuestionType type;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Difficulty difficulty;
    private Integer marks;
    private Integer sequenceOrder;

    public QuestionResponseDTO() {}

    public QuestionResponseDTO(Long id, Long topicId, String topicName, QuestionType type, String questionText,
                               String optionA, String optionB, String optionC, String optionD,
                               Difficulty difficulty, Integer marks, Integer sequenceOrder) {
        this.id = id;
        this.topicId = topicId;
        this.topicName = topicName;
        this.type = type;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.difficulty = difficulty;
        this.marks = marks;
        this.sequenceOrder = sequenceOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTopicId() {
        return topicId;
    }

    public void setTopicId(Long topicId) {
        this.topicId = topicId;
    }

    public String getTopicName() {
        return topicName;
    }

    public void setTopicName(String topicName) {
        this.topicName = topicName;
    }

    public QuestionType getType() {
        return type;
    }

    public void setType(QuestionType type) {
        this.type = type;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getOptionA() {
        return optionA;
    }

    public void setOptionA(String optionA) {
        this.optionA = optionA;
    }

    public String getOptionB() {
        return optionB;
    }

    public void setOptionB(String optionB) {
        this.optionB = optionB;
    }

    public String getOptionC() {
        return optionC;
    }

    public void setOptionC(String optionC) {
        this.optionC = optionC;
    }

    public String getOptionD() {
        return optionD;
    }

    public void setOptionD(String optionD) {
        this.optionD = optionD;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getMarks() {
        return marks;
    }

    public void setMarks(Integer marks) {
        this.marks = marks;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long topicId;
        private String topicName;
        private QuestionType type;
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private Difficulty difficulty;
        private Integer marks;
        private Integer sequenceOrder;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder topicId(Long topicId) {
            this.topicId = topicId;
            return this;
        }

        public Builder topicName(String topicName) {
            this.topicName = topicName;
            return this;
        }

        public Builder type(QuestionType type) {
            this.type = type;
            return this;
        }

        public Builder questionText(String questionText) {
            this.questionText = questionText;
            return this;
        }

        public Builder optionA(String optionA) {
            this.optionA = optionA;
            return this;
        }

        public Builder optionB(String optionB) {
            this.optionB = optionB;
            return this;
        }

        public Builder optionC(String optionC) {
            this.optionC = optionC;
            return this;
        }

        public Builder optionD(String optionD) {
            this.optionD = optionD;
            return this;
        }

        public Builder difficulty(Difficulty difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public Builder marks(Integer marks) {
            this.marks = marks;
            return this;
        }

        public Builder sequenceOrder(Integer sequenceOrder) {
            this.sequenceOrder = sequenceOrder;
            return this;
        }

        public QuestionResponseDTO build() {
            return new QuestionResponseDTO(id, topicId, topicName, type, questionText, optionA, optionB, optionC, optionD, difficulty, marks, sequenceOrder);
        }
    }
}
