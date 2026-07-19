package com.examshield.backend.dto;

import java.util.Map;

public class StudentTrackRequest {
    private int currentQuestionIndex;
    private String currentQuestionText;
    private int answeredCount;
    private int totalQuestions;
    private String lastAction;
    private Map<Integer, String> questionStatusMap;

    public StudentTrackRequest() {}

    public StudentTrackRequest(int currentQuestionIndex, String currentQuestionText, int answeredCount, int totalQuestions, String lastAction, Map<Integer, String> questionStatusMap) {
        this.currentQuestionIndex = currentQuestionIndex;
        this.currentQuestionText = currentQuestionText;
        this.answeredCount = answeredCount;
        this.totalQuestions = totalQuestions;
        this.lastAction = lastAction;
        this.questionStatusMap = questionStatusMap;
    }

    public int getCurrentQuestionIndex() {
        return currentQuestionIndex;
    }

    public void setCurrentQuestionIndex(int currentQuestionIndex) {
        this.currentQuestionIndex = currentQuestionIndex;
    }

    public String getCurrentQuestionText() {
        return currentQuestionText;
    }

    public void setCurrentQuestionText(String currentQuestionText) {
        this.currentQuestionText = currentQuestionText;
    }

    public int getAnsweredCount() {
        return answeredCount;
    }

    public void setAnsweredCount(int answeredCount) {
        this.answeredCount = answeredCount;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public String getLastAction() {
        return lastAction;
    }

    public void setLastAction(String lastAction) {
        this.lastAction = lastAction;
    }

    public Map<Integer, String> getQuestionStatusMap() {
        return questionStatusMap;
    }

    public void setQuestionStatusMap(Map<Integer, String> questionStatusMap) {
        this.questionStatusMap = questionStatusMap;
    }
}
