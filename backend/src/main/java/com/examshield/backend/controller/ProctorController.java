package com.examshield.backend.controller;

import com.examshield.backend.dto.ViolationResponseDTO;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.AttemptQuestion;
import com.examshield.backend.model.ExamAttempt;
import com.examshield.backend.model.Exam;
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
    private com.examshield.backend.repository.ExamRepository examRepository;

    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getAssignedExams(@AuthenticationPrincipal User proctor) {
        if (proctor.getRole() == com.examshield.backend.model.UserRole.ADMIN || proctor.getRole() == com.examshield.backend.model.UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(examRepository.findAll());
        }
        return ResponseEntity.ok(examRepository.findByProctorsId(proctor.getId()));
    }

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

    @PostMapping("/attempts/{attemptId}/warn")
    public ResponseEntity<?> warnStudent(
            @PathVariable Long attemptId,
            @RequestParam("message") String message,
            @AuthenticationPrincipal User proctor) {
        examAttemptService.warnAttempt(attemptId, message, proctor);
        return ResponseEntity.ok(Collections.singletonMap("message", "Student warned successfully"));
    }

    @PostMapping("/attempts/{attemptId}/suspend")
    public ResponseEntity<?> suspendStudent(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal User proctor) {
        examAttemptService.suspendAttempt(attemptId, proctor);
        return ResponseEntity.ok(Collections.singletonMap("message", "Student attempt suspended successfully"));
    }

    @PostMapping("/attempts/{attemptId}/reactivate")
    public ResponseEntity<?> reactivateStudent(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal User proctor) {
        examAttemptService.reactivateAttempt(attemptId, proctor);
        return ResponseEntity.ok(Collections.singletonMap("message", "Student attempt reactivated successfully"));
    }

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<Map<String, Object>> getAttemptDetails(@PathVariable Long attemptId) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("Attempt not found"));

        Map<String, Object> map = new java.util.HashMap<>();
        map.put("attemptId", attempt.getId());
        map.put("studentName", attempt.getStudent().getFullName());
        map.put("enrollmentNo", attempt.getStudent().getEnrollmentNo());
        map.put("examId", attempt.getExam().getId());
        map.put("examTitle", attempt.getExam().getTitle());
        map.put("status", attempt.getStatus().name());
        map.put("startedAt", attempt.getStartedAt());
        map.put("proctorNotes", attempt.getProctorNotes());
        map.put("violations", attempt.getViolations().stream()
                .map(DtoMapper::toViolationResponse)
                .collect(Collectors.toList()));
        return ResponseEntity.ok(map);
    }

    @PostMapping("/attempts/{attemptId}/notes")
    public ResponseEntity<?> saveProctorNotes(
            @PathVariable Long attemptId,
            @RequestBody Map<String, String> request) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("Attempt not found"));
        attempt.setProctorNotes(request.get("notes"));
        examAttemptRepository.save(attempt);
        return ResponseEntity.ok(Collections.singletonMap("message", "Proctor notes saved successfully"));
    }
}
