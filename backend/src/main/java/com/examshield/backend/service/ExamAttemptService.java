package com.examshield.backend.service;

import com.examshield.backend.dto.AnswerSubmitRequest;
import com.examshield.backend.dto.ViolationResponseDTO;
import com.examshield.backend.exception.*;
import com.examshield.backend.model.*;
import com.examshield.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExamAttemptService {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ExamAttemptRepository examAttemptRepository;

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    @Autowired
    private ExamQuestionPoolRepository examQuestionPoolRepository;

    @Autowired
    private ViolationRepository violationRepository;

    @Autowired
    private ShuffleService shuffleService;

    @Autowired
    private RedisTimerService redisTimerService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ExamAttempt startAttempt(Long examId, User student) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("Exam not found: " + examId));

        // Check if student already has an attempt
        Optional<ExamAttempt> existingOpt = examAttemptRepository.findByExamIdAndStudentId(examId, student.getId());

        LocalDateTime now = LocalDateTime.now();

        // Check windows
        if (now.isBefore(exam.getStartTime())) {
            throw new IllegalArgumentException("Exam has not started yet");
        }

        if (existingOpt.isPresent()) {
            ExamAttempt existing = existingOpt.get();
            // Duplicate attempt / Multi-tab prevention: if active, return existing
            if (existing.getStatus() == AttemptStatus.IN_PROGRESS) {
                return existing;
            } else {
                throw new DuplicateAttemptException("You have already submitted or were suspended from this exam");
            }
        }

        // Late entry check (grace period)
        LocalDateTime lateEntryCutoff = exam.getStartTime().plusMinutes(exam.getLateEntryMinutes());
        if (now.isAfter(lateEntryCutoff)) {
            throw new IllegalArgumentException("Late entry grace period of " + exam.getLateEntryMinutes() + " minutes has passed");
        }

        if (now.isAfter(exam.getEndTime())) {
            throw new IllegalArgumentException("Exam window has already closed");
        }

        // Fetch pool questions
        List<Question> pool = examQuestionPoolRepository.findByExamId(examId).stream()
                .map(ExamQuestionPool::getQuestion)
                .collect(Collectors.toList());

        // Perform shuffling
        String seed = student.getId() + "_" + exam.getId();
        List<Question> shuffledSelection = shuffleService.shuffleQuestions(
                pool, seed, exam.getEasyCount(), exam.getMediumCount(), exam.getHardCount()
        );

        // Save Attempt
        ExamAttempt attempt = ExamAttempt.builder()
                .exam(exam)
                .student(student)
                .seed(seed)
                .status(AttemptStatus.IN_PROGRESS)
                .build();

        ExamAttempt savedAttempt = examAttemptRepository.save(attempt);

        // Save shuffled question entities
        for (int i = 0; i < shuffledSelection.size(); i++) {
            AttemptQuestion aq = AttemptQuestion.builder()
                    .attempt(savedAttempt)
                    .question(shuffledSelection.get(i))
                    .sequenceOrder(i + 1)
                    .build();
            attemptQuestionRepository.save(aq);
        }

        // Start Redis Timer
        redisTimerService.startTimer(savedAttempt.getId(), exam.getDurationMinutes());

        return savedAttempt;
    }

    @Transactional
    public void saveAnswer(Long attemptId, AnswerSubmitRequest request, User student) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam attempt not found"));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedAccessException("Unauthorized attempt modification");
        }

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new AttemptAlreadySubmittedException("Exam has already been finalized/submitted");
        }

        AttemptQuestion aq = attemptQuestionRepository.findByAttemptIdAndQuestionId(attemptId, request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not mapped in this attempt"));

        aq.setStudentAnswer(request.getStudentAnswer());
        attemptQuestionRepository.save(aq);
    }

    @Transactional
    public void submitAttempt(Long attemptId, User student, boolean isAutoSubmit) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (student != null && !attempt.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedAccessException("Unauthorized attempt submit");
        }

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            return; // Already submitted
        }

        attempt.setStatus(isAutoSubmit ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());

        // Cancel Redis timer (if it was a manual submission, clean key)
        if (!isAutoSubmit) {
            redisTimerService.cancelTimer(attemptId);
        }

        // Grade MCQs & True/False automatically
        List<AttemptQuestion> attemptQuestions = attemptQuestionRepository.findByAttemptIdOrderBySequenceOrderAsc(attemptId);
        BigDecimal totalScore = BigDecimal.ZERO;
        boolean hasSubjective = false;

        for (AttemptQuestion aq : attemptQuestions) {
            Question q = aq.getQuestion();
            if (q.getType() == QuestionType.MCQ || q.getType() == QuestionType.TRUE_FALSE) {
                boolean correct = false;
                if (aq.getStudentAnswer() != null && q.getCorrectAnswer() != null) {
                    correct = aq.getStudentAnswer().trim().equalsIgnoreCase(q.getCorrectAnswer().trim());
                }
                aq.setIsCorrect(correct);
                aq.setMarksAwarded(correct ? BigDecimal.valueOf(q.getMarks()) : BigDecimal.ZERO);
                totalScore = totalScore.add(aq.getMarksAwarded());
            } else if (q.getType() == QuestionType.SUBJECTIVE) {
                hasSubjective = true;
                aq.setIsCorrect(null);
                aq.setMarksAwarded(null);
            }
        }

        attemptQuestionRepository.saveAll(attemptQuestions);

        // If there are no subjective questions, score is final
        if (!hasSubjective) {
            attempt.setTotalScore(totalScore);
        }

        examAttemptRepository.save(attempt);

        // If score is finalized, update ranks
        if (!hasSubjective) {
            calculateRanksAndPercentiles(attempt.getExam().getId());
        }
    }

    @Transactional
    public void autoSubmitAttempt(Long attemptId) {
        submitAttempt(attemptId, null, true);
    }

    @Transactional
    public void reportViolation(Long attemptId, ViolationType type, User student) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedAccessException("Unauthorized violation report");
        }

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            return;
        }

        Violation violation = Violation.builder()
                .attempt(attempt)
                .type(type)
                .build();

        violationRepository.save(violation);

        long violationCount = violationRepository.countByAttemptId(attemptId);

        // Broadcast to proctors
        ViolationResponseDTO violationDto = ViolationResponseDTO.builder()
                .id(violation.getId())
                .studentName(student.getFullName())
                .enrollmentNo(student.getEnrollmentNo())
                .type(type.name())
                .occurredAt(LocalDateTime.now())
                .attemptId(attemptId)
                .examId(attempt.getExam().getId())
                .build();

        messagingTemplate.convertAndSend("/topic/exam/" + attempt.getExam().getId() + "/violations", violationDto);

        // Auto-suspend check
        if (violationCount >= attempt.getExam().getMaxViolations()) {
            attempt.setStatus(AttemptStatus.SUSPENDED);
            attempt.setSubmittedAt(LocalDateTime.now());
            examAttemptRepository.save(attempt);

            redisTimerService.cancelTimer(attemptId);

            // Push notification lock to student screen
            messagingTemplate.convertAndSend("/topic/attempt/" + attemptId + "/status", 
                    Collections.singletonMap("status", "SUSPENDED"));
        }
    }

    @Transactional
    public void gradeSubjectiveQuestion(Long attemptQuestionId, BigDecimal marks, User proctor) {
        AttemptQuestion aq = attemptQuestionRepository.findById(attemptQuestionId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt question not found"));

        ExamAttempt attempt = aq.getAttempt();
        Question question = aq.getQuestion();

        if (question.getType() != QuestionType.SUBJECTIVE) {
            throw new IllegalArgumentException("This question is auto-graded and cannot be manually graded");
        }

        if (marks.compareTo(BigDecimal.valueOf(question.getMarks())) > 0 || marks.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Marks awarded must be between 0 and " + question.getMarks());
        }

        aq.setMarksAwarded(marks);
        aq.setIsCorrect(marks.compareTo(BigDecimal.ZERO) > 0);
        aq.setGradedBy(proctor);
        aq.setGradedAt(LocalDateTime.now());

        attemptQuestionRepository.save(aq);

        // Check if all subjective questions for this attempt are now graded
        List<AttemptQuestion> aqs = attemptQuestionRepository.findByAttemptIdOrderBySequenceOrderAsc(attempt.getId());
        boolean allGraded = true;
        BigDecimal sumScore = BigDecimal.ZERO;

        for (AttemptQuestion q : aqs) {
            if (q.getMarksAwarded() == null) {
                allGraded = false;
                break;
            }
            sumScore = sumScore.add(q.getMarksAwarded());
        }

        if (allGraded) {
            attempt.setTotalScore(sumScore);
            examAttemptRepository.save(attempt);

            // Recalculate rankings for this exam
            calculateRanksAndPercentiles(attempt.getExam().getId());
        }
    }

    @Transactional
    public void calculateRanksAndPercentiles(Long examId) {
        List<ExamAttempt> attempts = examAttemptRepository.findByExamId(examId).stream()
                .filter(a -> a.getTotalScore() != null)
                .sorted(Comparator.comparing(ExamAttempt::getTotalScore).reversed())
                .collect(Collectors.toList());

        int currentRank = 1;
        BigDecimal lastScore = null;
        for (int i = 0; i < attempts.size(); i++) {
            ExamAttempt current = attempts.get(i);
            if (lastScore == null || current.getTotalScore().compareTo(lastScore) != 0) {
                currentRank = i + 1;
            }
            current.setRank(currentRank);
            lastScore = current.getTotalScore();
        }

        examAttemptRepository.saveAll(attempts);
    }
}
