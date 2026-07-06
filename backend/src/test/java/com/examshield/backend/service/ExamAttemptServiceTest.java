package com.examshield.backend.service;

import com.examshield.backend.exception.DuplicateAttemptException;
import com.examshield.backend.model.*;
import com.examshield.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExamAttemptServiceTest {

    @Mock
    private ExamRepository examRepository;
    @Mock
    private ExamAttemptRepository examAttemptRepository;
    @Mock
    private AttemptQuestionRepository attemptQuestionRepository;
    @Mock
    private ExamQuestionPoolRepository examQuestionPoolRepository;
    @Mock
    private ViolationRepository violationRepository;
    @Mock
    private ShuffleService shuffleService;
    @Mock
    private RedisTimerService redisTimerService;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ExamAttemptService examAttemptService;

    private User student;
    private Exam exam;
    private ExamAttempt attempt;

    @BeforeEach
    public void setUp() {
        student = new User(1L, "Student Name", "student@test.com", "hash", UserRole.STUDENT, "EN1001", true, LocalDateTime.now());
        exam = new Exam();
        exam.setId(1L);
        exam.setTitle("Test Exam");
        exam.setStartTime(LocalDateTime.now().minusMinutes(5)); // already started
        exam.setEndTime(LocalDateTime.now().plusHours(2));
        exam.setLateEntryMinutes(10);
        exam.setDurationMinutes(60);
        exam.setMaxViolations(3);

        attempt = new ExamAttempt();
        attempt.setId(10L);
        attempt.setExam(exam);
        attempt.setStudent(student);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
    }

    @Test
    public void testStartAttemptReturnsExistingInProgressAttempt() {
        // Mock existing attempt
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(examAttemptRepository.findByExamIdAndStudentId(1L, 1L)).thenReturn(Optional.of(attempt));

        ExamAttempt result = examAttemptService.startAttempt(1L, student);

        assertEquals(attempt.getId(), result.getId());
        assertEquals(AttemptStatus.IN_PROGRESS, result.getStatus());
        // Verify no shuffling or save was performed (duplicate attempt prevention)
        verify(shuffleService, never()).shuffleQuestions(any(), anyString(), anyInt(), anyInt(), anyInt());
        verify(examAttemptRepository, never()).save(any(ExamAttempt.class));
    }

    @Test
    public void testStartAttemptThrowsExceptionIfAlreadySubmitted() {
        attempt.setStatus(AttemptStatus.SUBMITTED);
        
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(examAttemptRepository.findByExamIdAndStudentId(1L, 1L)).thenReturn(Optional.of(attempt));

        assertThrows(DuplicateAttemptException.class, () -> {
            examAttemptService.startAttempt(1L, student);
        });
    }

    @Test
    public void testReportViolationTriggersAutoSuspendExactlyAtMaxViolations() {
        when(examAttemptRepository.findById(10L)).thenReturn(Optional.of(attempt));
        
        // Mock violation count behavior
        // First violation
        when(violationRepository.countByAttemptId(10L)).thenReturn(1L);
        examAttemptService.reportViolation(10L, ViolationType.TAB_SWITCH, student);
        assertEquals(AttemptStatus.IN_PROGRESS, attempt.getStatus());

        // Second violation
        when(violationRepository.countByAttemptId(10L)).thenReturn(2L);
        examAttemptService.reportViolation(10L, ViolationType.WINDOW_BLUR, student);
        assertEquals(AttemptStatus.IN_PROGRESS, attempt.getStatus());

        // Third violation (reaches maxViolations = 3)
        when(violationRepository.countByAttemptId(10L)).thenReturn(3L);
        examAttemptService.reportViolation(10L, ViolationType.COPY, student);
        
        // Assert attempt is suspended
        assertEquals(AttemptStatus.SUSPENDED, attempt.getStatus());
        verify(redisTimerService, times(1)).cancelTimer(10L);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/attempt/10/status"), any(Object.class));
    }

    @Test
    public void testSubmitAttemptAutoGradesMcqAndLeavesSubjectiveUngraded() {
        // Setup MCQ Question
        Question mcq = new Question();
        mcq.setId(101L);
        mcq.setType(QuestionType.MCQ);
        mcq.setCorrectAnswer("A");
        mcq.setMarks(2);

        AttemptQuestion aqMcq = AttemptQuestion.builder()
                .attempt(attempt)
                .question(mcq)
                .studentAnswer("A") // correct
                .sequenceOrder(1)
                .build();

        // Setup Subjective Question
        Question sub = new Question();
        sub.setId(102L);
        sub.setType(QuestionType.SUBJECTIVE);
        sub.setMarks(5);

        AttemptQuestion aqSub = AttemptQuestion.builder()
                .attempt(attempt)
                .question(sub)
                .studentAnswer("Subjective answer body")
                .sequenceOrder(2)
                .build();

        List<AttemptQuestion> aqList = new ArrayList<>();
        aqList.add(aqMcq);
        aqList.add(aqSub);

        when(examAttemptRepository.findById(10L)).thenReturn(Optional.of(attempt));
        when(attemptQuestionRepository.findByAttemptIdOrderBySequenceOrderAsc(10L)).thenReturn(aqList);

        examAttemptService.submitAttempt(10L, student, false);

        // Assert MCQ graded correctly
        assertTrue(aqMcq.getIsCorrect());
        assertEquals(BigDecimal.valueOf(2), aqMcq.getMarksAwarded());

        // Assert Subjective remains ungraded
        assertNull(aqSub.getIsCorrect());
        assertNull(aqSub.getMarksAwarded());

        // Assert overall attempt status is SUBMITTED, and score is null (since subjective is pending)
        assertEquals(AttemptStatus.SUBMITTED, attempt.getStatus());
        assertNull(attempt.getTotalScore());
    }

    @Test
    public void testCalculateRanksAndPercentilesOrdersCorrectlyAndHandlesTies() {
        ExamAttempt a1 = ExamAttempt.builder().id(1L).totalScore(BigDecimal.valueOf(95.0)).build();
        ExamAttempt a2 = ExamAttempt.builder().id(2L).totalScore(BigDecimal.valueOf(80.0)).build();
        ExamAttempt a3 = ExamAttempt.builder().id(3L).totalScore(BigDecimal.valueOf(80.0)).build(); // Tie
        ExamAttempt a4 = ExamAttempt.builder().id(4L).totalScore(BigDecimal.valueOf(60.0)).build();

        List<ExamAttempt> attemptList = new ArrayList<>(List.of(a1, a2, a3, a4));
        when(examAttemptRepository.findByExamId(1L)).thenReturn(attemptList);

        examAttemptService.calculateRanksAndPercentiles(1L);

        // Assert ranks are assigned descending by score (with tie handling)
        assertEquals(1, a1.getRank());
        assertEquals(2, a2.getRank());
        assertEquals(2, a3.getRank()); // Tied with a2
        assertEquals(4, a4.getRank()); // Skips rank 3 due to standard competition ranking
    }
}
