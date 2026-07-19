package com.examshield.backend.controller;

import com.examshield.backend.dto.AnswerSubmitRequest;
import com.examshield.backend.dto.ExamAttemptResponseDTO;
import com.examshield.backend.dto.ViolationReportRequest;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.Exam;
import com.examshield.backend.model.ExamAttempt;
import com.examshield.backend.model.User;
import com.examshield.backend.repository.ExamRepository;
import com.examshield.backend.security.RateLimiterService;
import com.examshield.backend.service.ExamAttemptService;
import com.examshield.backend.service.RedisTimerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ExamAttemptService examAttemptService;

    @Autowired
    private RedisTimerService redisTimerService;

    @Autowired
    private RateLimiterService rateLimiterService;

    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getAvailableExams(@AuthenticationPrincipal User student) {
        return ResponseEntity.ok(examRepository.findByIsPublishedTrueAndStudentsId(student.getId()));
    }

    @PostMapping("/exams/{examId}/start")
    public ResponseEntity<ExamAttemptResponseDTO> startExam(
            @PathVariable Long examId,
            @AuthenticationPrincipal User student) {
        ExamAttempt attempt;
        try {
            attempt = examAttemptService.startAttempt(examId, student);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            try {
                Thread.sleep(150);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
            attempt = examAttemptService.getAttemptByExamAndStudent(examId, student)
                    .orElseThrow(() -> e);
        }
        Long remainingSeconds = redisTimerService.getRemainingSeconds(attempt.getId());
        return ResponseEntity.ok(DtoMapper.toExamAttemptResponse(attempt, remainingSeconds));
    }

    @PostMapping("/attempts/{attemptId}/answer")
    public ResponseEntity<?> saveAnswer(
            @PathVariable Long attemptId,
            @Valid @RequestBody AnswerSubmitRequest request,
            @AuthenticationPrincipal User student,
            HttpServletRequest httpRequest) {
        
        // Rate limiting key: IP + studentId
        String rateLimitKey = student.getId() + "_" + httpRequest.getRemoteAddr();
        if (!rateLimiterService.tryConsumeAnswer(rateLimitKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Collections.singletonMap("message", "Too many autosave requests. Slow down."));
        }

        examAttemptService.saveAnswer(attemptId, request, student);
        return ResponseEntity.ok(Collections.singletonMap("message", "Answer autosaved"));
    }

    @GetMapping("/attempts/{attemptId}/timer")
    public ResponseEntity<?> getRemainingTime(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal User student) {
        Long remainingSeconds = redisTimerService.getRemainingSeconds(attemptId);
        return ResponseEntity.ok(Collections.singletonMap("remainingSeconds", remainingSeconds));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<?> submitExam(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal User student) {
        examAttemptService.submitAttempt(attemptId, student, false);
        return ResponseEntity.ok(Collections.singletonMap("message", "Exam submitted successfully"));
    }

    @PostMapping("/attempts/{attemptId}/violation")
    public ResponseEntity<?> reportViolation(
            @PathVariable Long attemptId,
            @Valid @RequestBody ViolationReportRequest request,
            @AuthenticationPrincipal User student) {
        examAttemptService.reportViolation(attemptId, request.getType(), student);
        ExamAttempt attempt = examAttemptRepository.findById(attemptId).orElse(null);
        String status = attempt != null ? attempt.getStatus().name() : "IN_PROGRESS";

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "Violation reported");
        response.put("status", status);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/attempts/{attemptId}/track")
    public ResponseEntity<?> updateTrack(
            @PathVariable Long attemptId,
            @RequestBody com.examshield.backend.dto.StudentTrackRequest request,
            @AuthenticationPrincipal User student) {
        examAttemptService.updateStudentTrack(attemptId, request, student);
        return ResponseEntity.ok().build();
    }
    @Autowired
    private com.examshield.backend.repository.ExamAttemptRepository examAttemptRepository;

    @GetMapping("/attempts")
    public ResponseEntity<List<ExamAttemptResponseDTO>> getMyAttempts(
            @AuthenticationPrincipal User student) {
        List<ExamAttempt> attempts = examAttemptRepository.findByStudentId(student.getId());
        List<ExamAttemptResponseDTO> response = attempts.stream()
                .map(a -> {
                    Long remainingSeconds = redisTimerService.getRemainingSeconds(a.getId());
                    return DtoMapper.toExamAttemptResponse(a, remainingSeconds);
                })
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
