package com.examshield.backend.service;

import com.examshield.backend.aspect.Auditable;
import com.examshield.backend.dto.ExamCreateRequest;
import com.examshield.backend.dto.ExamSectionDto;
import com.examshield.backend.exception.ExamNotFoundException;
import com.examshield.backend.exception.QuestionPoolLockedException;
import com.examshield.backend.model.*;
import com.examshield.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExamService {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ExamSectionRepository examSectionRepository;

    @Autowired
    private ExamQuestionPoolRepository examQuestionPoolRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExamAttemptRepository examAttemptRepository;

    @Transactional
    public Exam createExam(ExamCreateRequest request, User creator) {
        // Validate dates
        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        Exam exam = Exam.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .lateEntryMinutes(request.getLateEntryMinutes() != null ? request.getLateEntryMinutes() : 10)
                .durationMinutes(request.getDurationMinutes())
                .totalQuestions(request.getTotalQuestions())
                .easyCount(request.getEasyCount() != null ? request.getEasyCount() : 0)
                .mediumCount(request.getMediumCount() != null ? request.getMediumCount() : 0)
                .hardCount(request.getHardCount() != null ? request.getHardCount() : 0)
                .passingMarks(request.getPassingMarks())
                .maxViolations(request.getMaxViolations() != null ? request.getMaxViolations() : 3)
                .isSectioned(request.getIsSectioned() != null ? request.getIsSectioned() : false)
                .isPublished(false)
                .createdBy(creator)
                .build();

        Exam savedExam = examRepository.save(exam);

        if (Boolean.TRUE.equals(request.getIsSectioned()) && request.getSections() != null) {
            int totalSectionQuestions = 0;
            for (ExamSectionDto secDto : request.getSections()) {
                ExamSection section = ExamSection.builder()
                        .exam(savedExam)
                        .name(secDto.getName())
                        .questionCount(secDto.getQuestionCount())
                        .durationMinutes(secDto.getDurationMinutes())
                        .build();
                examSectionRepository.save(section);
                totalSectionQuestions += secDto.getQuestionCount();
            }

            if (totalSectionQuestions != request.getTotalQuestions()) {
                throw new IllegalArgumentException("Sum of section question counts (" + totalSectionQuestions 
                        + ") does not match total exam question count (" + request.getTotalQuestions() + ")");
            }
        }

        return savedExam;
    }

    @Transactional
    public Exam updateExam(Long examId, ExamCreateRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("Exam not found: " + examId));

        if (Boolean.TRUE.equals(exam.getIsPublished())) {
            throw new QuestionPoolLockedException("Cannot modify details of a published exam");
        }

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());
        exam.setLateEntryMinutes(request.getLateEntryMinutes());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setTotalQuestions(request.getTotalQuestions());
        exam.setEasyCount(request.getEasyCount());
        exam.setMediumCount(request.getMediumCount());
        exam.setHardCount(request.getHardCount());
        exam.setPassingMarks(request.getPassingMarks());
        exam.setMaxViolations(request.getMaxViolations());

        // Recreate sections if sectioned status changed or if new sections list passed
        if (Boolean.TRUE.equals(exam.getIsSectioned())) {
            examSectionRepository.deleteAll(exam.getSections());
            exam.getSections().clear();

            if (request.getSections() != null) {
                int totalSectionQuestions = 0;
                for (ExamSectionDto secDto : request.getSections()) {
                    ExamSection section = ExamSection.builder()
                            .exam(exam)
                            .name(secDto.getName())
                            .questionCount(secDto.getQuestionCount())
                            .durationMinutes(secDto.getDurationMinutes())
                            .build();
                    examSectionRepository.save(section);
                    totalSectionQuestions += secDto.getQuestionCount();
                    exam.getSections().add(section);
                }
                if (totalSectionQuestions != request.getTotalQuestions()) {
                    throw new IllegalArgumentException("Sum of section question counts does not match total exam count");
                }
            }
        }

        return examRepository.save(exam);
    }

    @Transactional
    @Auditable(action = "EXAM_PUBLISHED")
    public void publishExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("Exam not found: " + examId));

        if (Boolean.TRUE.equals(exam.getIsPublished())) {
            return;
        }

        // Validate pool completeness before locking
        List<ExamQuestionPool> pool = examQuestionPoolRepository.findByExamId(examId);
        long easyCountInPool = pool.stream().filter(p -> p.getQuestion().getDifficulty() == Difficulty.EASY).count();
        long mediumCountInPool = pool.stream().filter(p -> p.getQuestion().getDifficulty() == Difficulty.MEDIUM).count();
        long hardCountInPool = pool.stream().filter(p -> p.getQuestion().getDifficulty() == Difficulty.HARD).count();

        if (easyCountInPool < exam.getEasyCount() || mediumCountInPool < exam.getMediumCount() || hardCountInPool < exam.getHardCount()) {
            throw new IllegalArgumentException(String.format("Cannot publish exam. Question pool is insufficient. " +
                    "Required: %dE/%dM/%dH, Available: %dE/%dM/%dH",
                    exam.getEasyCount(), exam.getMediumCount(), exam.getHardCount(),
                    easyCountInPool, mediumCountInPool, hardCountInPool));
        }

        exam.setIsPublished(true);
        examRepository.save(exam);
    }

    @Transactional
    public void addQuestionToPool(Long examId, Long sectionId, Long questionId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("Exam not found"));

        if (Boolean.TRUE.equals(exam.getIsPublished())) {
            throw new QuestionPoolLockedException("Cannot add questions to a published exam pool");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        ExamSection section = null;
        if (sectionId != null) {
            section = examSectionRepository.findById(sectionId)
                    .orElseThrow(() -> new IllegalArgumentException("Section not found"));
            if (!section.getExam().getId().equals(examId)) {
                throw new IllegalArgumentException("Section does not belong to this exam");
            }
        }

        if (examQuestionPoolRepository.existsByExamIdAndQuestionId(examId, questionId)) {
            return; // Already exists
        }

        ExamQuestionPool poolEntry = ExamQuestionPool.builder()
                .exam(exam)
                .section(section)
                .question(question)
                .build();

        examQuestionPoolRepository.save(poolEntry);
    }

    @Transactional
    public void assignProctor(Long examId, Long proctorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("Exam not found"));

        User proctor = userRepository.findById(proctorId)
                .orElseThrow(() -> new IllegalArgumentException("Proctor not found"));

        if (proctor.getRole() != UserRole.PROCTOR && proctor.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("User is not a proctor or administrator");
        }

        exam.getProctors().add(proctor);
        examRepository.save(exam);
    }

    public Map<String, Object> getAnalytics(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("Exam not found"));

        List<ExamAttempt> attempts = examAttemptRepository.findByExamId(examId);

        int totalAttempts = attempts.size();
        long submittedCount = attempts.stream().filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED).count();
        long suspendedCount = attempts.stream().filter(a -> a.getStatus() == AttemptStatus.SUSPENDED).count();

        List<ExamAttempt> gradedAttempts = attempts.stream()
                .filter(a -> a.getTotalScore() != null)
                .sorted(Comparator.comparing(ExamAttempt::getTotalScore).reversed())
                .collect(Collectors.toList());

        long passedCount = gradedAttempts.stream()
                .filter(a -> a.getTotalScore().doubleValue() >= exam.getPassingMarks())
                .count();

        double avgScore = gradedAttempts.stream()
                .mapToDouble(a -> a.getTotalScore().doubleValue())
                .average()
                .orElse(0.0);

        List<Map<String, Object>> topperList = gradedAttempts.stream()
                .limit(5)
                .map(a -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("studentName", a.getStudent().getFullName());
                    map.put("enrollmentNo", a.getStudent().getEnrollmentNo());
                    map.put("score", a.getTotalScore());
                    map.put("rank", a.getRank());
                    return map;
                })
                .collect(Collectors.toList());

        // Score distributions for charts
        Map<String, Long> scoreRanges = new LinkedHashMap<>();
        scoreRanges.put("0-20%", 0L);
        scoreRanges.put("21-40%", 0L);
        scoreRanges.put("41-60%", 0L);
        scoreRanges.put("61-80%", 0L);
        scoreRanges.put("81-100%", 0L);

        double maxScorePossible = gradedAttempts.isEmpty() ? 1.0 : gradedAttempts.get(0).getAttemptQuestions().stream()
                .mapToDouble(aq -> aq.getQuestion().getMarks())
                .sum();
        if (maxScorePossible == 0.0) maxScorePossible = 1.0;

        for (ExamAttempt attempt : gradedAttempts) {
            double percent = (attempt.getTotalScore().doubleValue() / maxScorePossible) * 100.0;
            if (percent <= 20) scoreRanges.put("0-20%", scoreRanges.get("0-20%") + 1);
            else if (percent <= 40) scoreRanges.put("21-40%", scoreRanges.get("21-40%") + 1);
            else if (percent <= 60) scoreRanges.put("41-60%", scoreRanges.get("41-60%") + 1);
            else if (percent <= 80) scoreRanges.put("61-80%", scoreRanges.get("61-80%") + 1);
            else scoreRanges.put("81-100%", scoreRanges.get("81-100%") + 1);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("examId", exam.getId());
        response.put("title", exam.getTitle());
        response.put("totalRegistered", totalAttempts);
        response.put("submittedCount", submittedCount);
        response.put("suspendedCount", suspendedCount);
        response.put("passedCount", passedCount);
        response.put("passRatePercent", totalAttempts == 0 ? 0.0 : BigDecimal.valueOf((double) passedCount / totalAttempts * 100).setScale(2, RoundingMode.HALF_UP));
        response.put("avgScore", BigDecimal.valueOf(avgScore).setScale(2, RoundingMode.HALF_UP));
        response.put("toppers", topperList);
        response.put("scoreDistribution", scoreRanges);

        return response;
    }
}
