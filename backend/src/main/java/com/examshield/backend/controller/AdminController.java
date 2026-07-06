package com.examshield.backend.controller;

import com.examshield.backend.dto.AdminQuestionResponseDTO;
import com.examshield.backend.dto.ExamCreateRequest;
import com.examshield.backend.dto.QuestionCreateRequest;
import com.examshield.backend.model.Exam;
import com.examshield.backend.model.User;
import com.examshield.backend.service.ExamService;
import com.examshield.backend.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private QuestionService questionService;

    @Autowired
    private ExamService examService;

    @PostMapping("/questions")
    public ResponseEntity<AdminQuestionResponseDTO> createQuestion(
            @Valid @RequestBody QuestionCreateRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request, admin));
    }

    @PostMapping("/questions/bulk-upload")
    public ResponseEntity<?> bulkUpload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User admin) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "File is empty"));
        }
        Map<String, Object> result = questionService.bulkUploadQuestions(file, admin);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/exams")
    public ResponseEntity<Exam> createExam(
            @Valid @RequestBody ExamCreateRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.createExam(request, admin));
    }

    @PutMapping("/exams/{id}")
    public ResponseEntity<Exam> updateExam(
            @PathVariable Long id,
            @Valid @RequestBody ExamCreateRequest request) {
        return ResponseEntity.ok(examService.updateExam(id, request));
    }

    @PostMapping("/exams/{id}/publish")
    public ResponseEntity<?> publishExam(@PathVariable Long id) {
        try {
            examService.publishExam(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Exam published and question pool locked successfully"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", ex.getMessage()));
        }
    }

    @PostMapping("/exams/{id}/questions")
    public ResponseEntity<?> addQuestionToPool(
            @PathVariable Long id,
            @RequestParam("questionId") Long questionId,
            @RequestParam(value = "sectionId", required = false) Long sectionId) {
        examService.addQuestionToPool(id, sectionId, questionId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Question successfully added to exam pool"));
    }

    @PostMapping("/exams/{id}/proctors")
    public ResponseEntity<?> assignProctor(
            @PathVariable Long id,
            @RequestParam("proctorId") Long proctorId) {
        examService.assignProctor(id, proctorId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Proctor successfully assigned to exam"));
    }

    @GetMapping("/exams/{id}/analytics")
    public ResponseEntity<Map<String, Object>> getExamAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getAnalytics(id));
    }
}
