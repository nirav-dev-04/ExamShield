package com.examshield.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

public class ExamCreateRequest {
    @NotBlank(message = "Exam title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @Min(value = 0, message = "Late entry minutes must be positive")
    private Integer lateEntryMinutes;

    @NotNull(message = "Duration in minutes is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    @NotNull(message = "Total questions is required")
    @Min(value = 1, message = "Total questions must be at least 1")
    private Integer totalQuestions;

    @Min(value = 0, message = "Easy count must be positive")
    private Integer easyCount;

    @Min(value = 0, message = "Medium count must be positive")
    private Integer mediumCount;

    @Min(value = 0, message = "Hard count must be positive")
    private Integer hardCount;

    @NotNull(message = "Passing marks is required")
    @Min(value = 1, message = "Passing marks must be at least 1")
    private Integer passingMarks;

    @Min(value = 1, message = "Max violations must be at least 1")
    private Integer maxViolations;

    private Boolean isSectioned;

    @Valid
    private List<ExamSectionDto> sections;

    public ExamCreateRequest() {}

    public ExamCreateRequest(String title, String description, LocalDateTime startTime, LocalDateTime endTime,
                              Integer lateEntryMinutes, Integer durationMinutes, Integer totalQuestions,
                              Integer easyCount, Integer mediumCount, Integer hardCount, Integer passingMarks,
                              Integer maxViolations, Boolean isSectioned, List<ExamSectionDto> sections) {
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.lateEntryMinutes = lateEntryMinutes;
        this.durationMinutes = durationMinutes;
        this.totalQuestions = totalQuestions;
        this.easyCount = easyCount;
        this.mediumCount = mediumCount;
        this.hardCount = hardCount;
        this.passingMarks = passingMarks;
        this.maxViolations = maxViolations;
        this.isSectioned = isSectioned;
        this.sections = sections;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Integer getLateEntryMinutes() {
        return lateEntryMinutes;
    }

    public void setLateEntryMinutes(Integer lateEntryMinutes) {
        this.lateEntryMinutes = lateEntryMinutes;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getEasyCount() {
        return easyCount;
    }

    public void setEasyCount(Integer easyCount) {
        this.easyCount = easyCount;
    }

    public Integer getMediumCount() {
        return mediumCount;
    }

    public void setMediumCount(Integer mediumCount) {
        this.mediumCount = mediumCount;
    }

    public Integer getHardCount() {
        return hardCount;
    }

    public void setHardCount(Integer hardCount) {
        this.hardCount = hardCount;
    }

    public Integer getPassingMarks() {
        return passingMarks;
    }

    public void setPassingMarks(Integer passingMarks) {
        this.passingMarks = passingMarks;
    }

    public Integer getMaxViolations() {
        return maxViolations;
    }

    public void setMaxViolations(Integer maxViolations) {
        this.maxViolations = maxViolations;
    }

    public Boolean getIsSectioned() {
        return isSectioned;
    }

    public void setIsSectioned(Boolean isSectioned) {
        this.isSectioned = isSectioned;
    }

    public List<ExamSectionDto> getSections() {
        return sections;
    }

    public void setSections(List<ExamSectionDto> sections) {
        this.sections = sections;
    }
}
