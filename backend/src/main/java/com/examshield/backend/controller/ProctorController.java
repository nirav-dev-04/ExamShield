package com.examshield.backend.controller;

import com.examshield.backend.dto.ViolationResponseDTO;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.AttemptQuestion;
import com.examshield.backend.model.ExamAttempt;
import com.examshield.backend.model.QuestionType;
import com.examshield.backend.model.User;
import com.examshield.backend.repository.AttemptQuestionRepository;
import com.examshield.backend.repository.ExamAttemptRepository;
import com.examshield.backend.repository.ViolationRepository;
import com.examshield.backend.service.ExamAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/proctor")
public class ProctorController {

    @Autowired
    private ExamAttemptRepository examAttemptRepository;

    @Autowired
    private ViolationRepository violationRepository;

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    @Autowired
    private ExamAttemptService examAttemptService;

    @GetMapping("/exams/{examId}/live-students")
    public ResponseEntity<List<Map<String, Object>>> getLiveStudents(@PathVariable Long examId) {
        List<ExamAttempt> attempts = examAttemptRepository.findByExamId(examId);
        List<Map<String, Object>> response = attempts.stream()
                .map(a -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("attemptId", a.getId());
                    map.put("studentName", a.getStudent().getFullName());
                    map.put("enrollmentNo", a.getStudent().getEnrollmentNo());
                    map.put("status", a.getStatus().name());
                    map.put("startedAt", a.getStartedAt());
                    map.put("violationsCount", a.getViolations().size());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // WebSocket Offline Sync REST Fallback Endpoint
    @GetMapping("/exams/{examId}/violations")
    public ResponseEntity<List<ViolationResponseDTO>> getViolationsSince(
            @PathVariable Long examId,
            @RequestParam("since") Long sinceTimestamp) {
        
        LocalDateTime sinceTime = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(sinceTimestamp), ZoneId.systemDefault()
        );

        List<ViolationResponseDTO> violations = violationRepository
                .findByAttemptExamIdAndOccurredAtAfterOrderByOccurredAtAsc(examId, sinceTime)
                .stream()
                .map(DtoMapper::toViolationResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(violations);
    }

    @GetMapping("/exams/{examId}/subjective-queue")
    public ResponseEntity<List<Map<String, Object>>> getSubjectiveQueue(@PathVariable Long examId) {
        List<AttemptQuestion> ungraded = attemptQuestionRepository.findUngradedSubjectiveQuestions(examId, QuestionType.SUBJECTIVE);
        List<Map<String, Object>> response = ungraded.stream()
                .map(aq -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("attemptQuestionId", aq.getId());
                    map.put("studentName", aq.getAttempt().getStudent().getFullName());
                    map.put("enrollmentNo", aq.getAttempt().getStudent().getEnrollmentNo());
                    map.put("questionId", aq.getQuestion().getId());
                    map.put("questionText", aq.getQuestion().getQuestionText());
                    map.put("studentAnswer", aq.getStudentAnswer());
                    map.put("maxMarks", aq.getQuestion().getMarks());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/attempt-questions/{id}/grade")
    public ResponseEntity<?> gradeSubjective(
            @PathVariable Long id,
            @RequestParam("marks") Double marks,
            @AuthenticationPrincipal User proctor) {
        examAttemptService.gradeSubjectiveQuestion(id, BigDecimal.valueOf(marks), proctor);
        return ResponseEntity.ok(Collections.singletonMap("message", "Subjective question graded successfully"));
    }
}
