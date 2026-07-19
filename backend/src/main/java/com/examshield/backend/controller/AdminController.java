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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private QuestionService questionService;

    @Autowired
    private ExamService examService;

    @Autowired
    private com.examshield.backend.service.UserService userService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.examshield.backend.repository.ExamRepository examRepository;

    @Autowired
    private com.examshield.backend.repository.ViolationRepository violationRepository;

    @Autowired
    private com.examshield.backend.repository.ExamAttemptRepository examAttemptRepository;

    @GetMapping("/questions")
    public ResponseEntity<org.springframework.data.domain.Page<AdminQuestionResponseDTO>> getQuestions(
            @RequestParam(value = "topicId", required = false) Long topicId,
            @RequestParam(value = "difficulty", required = false) com.examshield.backend.model.Difficulty difficulty,
            @RequestParam(value = "type", required = false) com.examshield.backend.model.QuestionType type,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(questionService.getQuestions(topicId, difficulty, type, search, pageable));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<AdminQuestionResponseDTO> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionCreateRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Question deleted successfully"));
    }

    @Autowired
    private com.examshield.backend.repository.TopicRepository topicRepository;

    @GetMapping("/topics")
    public ResponseEntity<List<com.examshield.backend.model.Topic>> getAllTopics() {
        return ResponseEntity.ok(topicRepository.findAll());
    }

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

    @DeleteMapping("/exams/{id}")
    public ResponseEntity<?> deleteExam(@PathVariable Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("Exam not found"));
        examRepository.delete(exam);
        return ResponseEntity.ok(Collections.singletonMap("message", "Exam deleted successfully"));
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

    @GetMapping("/exams/{id}/pool")
    public ResponseEntity<List<AdminQuestionResponseDTO>> getExamQuestionPool(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamQuestionPool(id));
    }

    @DeleteMapping("/exams/{id}/questions/{questionId}")
    public ResponseEntity<?> removeQuestionFromPool(
            @PathVariable Long id,
            @PathVariable Long questionId) {
        examService.removeQuestionFromPool(id, questionId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Question successfully removed from exam pool"));
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

    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/exams/{id}/analytics")
    public ResponseEntity<Map<String, Object>> getExamAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getAnalytics(id));
    }

    @Autowired
    private com.examshield.backend.repository.UserRepository userRepository;

    @GetMapping("/proctors")
    public ResponseEntity<List<User>> getProctors() {
        return ResponseEntity.ok(userRepository.findByRole(com.examshield.backend.model.UserRole.PROCTOR));
    }

    @PostMapping("/users")
    public ResponseEntity<com.examshield.backend.dto.UserResponseDTO> createUser(
            @Valid @RequestBody com.examshield.backend.dto.UserRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @GetMapping("/users")
    public ResponseEntity<org.springframework.data.domain.Page<com.examshield.backend.dto.UserResponseDTO>> getUsers(
            @RequestParam(value = "role", required = false) com.examshield.backend.model.UserRole role,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<User> usersPage;
        if (role != null) {
            usersPage = userRepository.findByRole(role, pageable);
        } else {
            usersPage = userRepository.findAll(pageable);
        }
        org.springframework.data.domain.Page<com.examshield.backend.dto.UserResponseDTO> dtoPage = usersPage.map(com.examshield.backend.mapper.DtoMapper::toUserResponse);
        return ResponseEntity.ok(dtoPage);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<com.examshield.backend.dto.UserResponseDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody com.examshield.backend.dto.UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("User not found"));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered by another user");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setEnrollmentNo(request.getEnrollmentNo());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(com.examshield.backend.mapper.DtoMapper.toUserResponse(updatedUser));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long id,
            @RequestParam("active") boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("User not found"));
        user.setIsActive(active);
        userRepository.save(user);
        return ResponseEntity.ok(Collections.singletonMap("message", "User status updated successfully"));
    }

    // Student Exam Assignment Endpoints
    @GetMapping("/exams/{id}/students")
    public ResponseEntity<List<com.examshield.backend.dto.UserResponseDTO>> getExamStudents(@PathVariable Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("Exam not found"));
        List<com.examshield.backend.dto.UserResponseDTO> dtos = exam.getStudents().stream()
                .map(com.examshield.backend.mapper.DtoMapper::toUserResponse)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/exams/{id}/students")
    public ResponseEntity<?> assignStudents(
            @PathVariable Long id,
            @RequestBody List<Long> studentIds) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("Exam not found"));

        List<User> students = userRepository.findAllById(studentIds);
        exam.getStudents().clear();
        exam.getStudents().addAll(students);
        examRepository.save(exam);

        return ResponseEntity.ok(Collections.singletonMap("message", "Students successfully assigned to exam"));
    }

    @DeleteMapping("/exams/{id}/students/{studentId}")
    public ResponseEntity<?> unassignStudent(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new com.examshield.backend.exception.ResourceNotFoundException("Exam not found"));

        exam.getStudents().removeIf(s -> s.getId().equals(studentId));
        examRepository.save(exam);

        return ResponseEntity.ok(Collections.singletonMap("message", "Student successfully unassigned from exam"));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        long totalExams = examRepository.count();
        long totalStudents = userRepository.countByRole(com.examshield.backend.model.UserRole.STUDENT);
        long totalProctors = userRepository.countByRole(com.examshield.backend.model.UserRole.PROCTOR);
        long totalViolations = violationRepository.count();

        // 10 most recent activity logs/violations
        List<Map<String, Object>> recentActivity = violationRepository.findTop10ByOrderByOccurredAtDesc().stream()
                .map(v -> {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("id", v.getId());
                    item.put("studentName", v.getAttempt().getStudent().getFullName());
                    item.put("examTitle", v.getAttempt().getExam().getTitle());
                    item.put("type", v.getType().name());
                    item.put("occurredAt", v.getOccurredAt());
                    return item;
                })
                .collect(java.util.stream.Collectors.toList());

        Map<String, Object> map = new java.util.HashMap<>();
        map.put("totalExams", totalExams);
        map.put("totalStudents", totalStudents);
        map.put("totalProctors", totalProctors);
        map.put("totalViolations", totalViolations);
        map.put("recentActivity", recentActivity);

        return ResponseEntity.ok(map);
    }
}
