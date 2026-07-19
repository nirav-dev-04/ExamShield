package com.examshield.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "exams")
public class Exam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "late_entry_minutes")
    private Integer lateEntryMinutes = 10;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "easy_count")
    private Integer easyCount = 0;

    @Column(name = "medium_count")
    private Integer mediumCount = 0;

    @Column(name = "hard_count")
    private Integer hardCount = 0;

    @Column(name = "passing_marks", nullable = false)
    private Integer passingMarks;

    @Column(name = "max_violations")
    private Integer maxViolations = 3;

    @Column(name = "is_sectioned")
    private Boolean isSectioned = false;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamSection> sections = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "exam_proctors",
        joinColumns = @JoinColumn(name = "exam_id"),
        inverseJoinColumns = @JoinColumn(name = "proctor_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Set<User> proctors = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "exam_students",
        joinColumns = @JoinColumn(name = "exam_id"),
        inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Set<User> students = new HashSet<>();

    public Exam() {}

    public Exam(Long id, String title, String description, LocalDateTime startTime, LocalDateTime endTime,
                Integer lateEntryMinutes, Integer durationMinutes, Integer totalQuestions, Integer easyCount,
                Integer mediumCount, Integer hardCount, Integer passingMarks, Integer maxViolations,
                Boolean isSectioned, Boolean isPublished, User createdBy, LocalDateTime createdAt,
                List<ExamSection> sections, Set<User> proctors, Set<User> students) {
        this.id = id;
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
        this.isPublished = isPublished;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        if (sections != null) this.sections = sections;
        if (proctors != null) this.proctors = proctors;
        if (students != null) this.students = students;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Boolean getIsPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<ExamSection> getSections() {
        return sections;
    }

    public void setSections(List<ExamSection> sections) {
        this.sections = sections;
    }

    public Set<User> getProctors() {
        return proctors;
    }

    public void setProctors(Set<User> proctors) {
        this.proctors = proctors;
    }

    public Set<User> getStudents() {
        return students;
    }

    public void setStudents(Set<User> students) {
        this.students = students;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String title;
        private String description;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer lateEntryMinutes = 10;
        private Integer durationMinutes;
        private Integer totalQuestions;
        private Integer easyCount = 0;
        private Integer mediumCount = 0;
        private Integer hardCount = 0;
        private Integer passingMarks;
        private Integer maxViolations = 3;
        private Boolean isSectioned = false;
        private Boolean isPublished = false;
        private User createdBy;
        private LocalDateTime createdAt;
        private List<ExamSection> sections = new ArrayList<>();
        private Set<User> proctors = new HashSet<>();
        private Set<User> students = new HashSet<>();

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder startTime(LocalDateTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(LocalDateTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder lateEntryMinutes(Integer lateEntryMinutes) {
            this.lateEntryMinutes = lateEntryMinutes;
            return this;
        }

        public Builder durationMinutes(Integer durationMinutes) {
            this.durationMinutes = durationMinutes;
            return this;
        }

        public Builder totalQuestions(Integer totalQuestions) {
            this.totalQuestions = totalQuestions;
            return this;
        }

        public Builder easyCount(Integer easyCount) {
            this.easyCount = easyCount;
            return this;
        }

        public Builder mediumCount(Integer mediumCount) {
            this.mediumCount = mediumCount;
            return this;
        }

        public Builder hardCount(Integer hardCount) {
            this.hardCount = hardCount;
            return this;
        }

        public Builder passingMarks(Integer passingMarks) {
            this.passingMarks = passingMarks;
            return this;
        }

        public Builder maxViolations(Integer maxViolations) {
            this.maxViolations = maxViolations;
            return this;
        }

        public Builder isSectioned(Boolean isSectioned) {
            this.isSectioned = isSectioned;
            return this;
        }

        public Builder isPublished(Boolean isPublished) {
            this.isPublished = isPublished;
            return this;
        }

        public Builder createdBy(User createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder sections(List<ExamSection> sections) {
            this.sections = sections;
            return this;
        }

        public Builder proctors(Set<User> proctors) {
            this.proctors = proctors;
            return this;
        }

        public Builder students(Set<User> students) {
            this.students = students;
            return this;
        }

        public Exam build() {
            return new Exam(id, title, description, startTime, endTime, lateEntryMinutes, durationMinutes, totalQuestions, easyCount, mediumCount, hardCount, passingMarks, maxViolations, isSectioned, isPublished, createdBy, createdAt, sections, proctors, students);
        }
    }
}
