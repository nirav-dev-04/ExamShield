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
    public ResponseEntity<List<Exam>> getAvailableExams() {
        return ResponseEntity.ok(examRepository.findByIsPublishedTrue());
    }

    @PostMapping("/exams/{examId}/start")
    public ResponseEntity<ExamAttemptResponseDTO> startExam(
            @PathVariable Long examId,
            @AuthenticationPrincipal User student) {
        ExamAttempt attempt = examAttemptService.startAttempt(examId, student);
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
        return ResponseEntity.ok(Collections.singletonMap("message", "Violation reported"));
    }
}
