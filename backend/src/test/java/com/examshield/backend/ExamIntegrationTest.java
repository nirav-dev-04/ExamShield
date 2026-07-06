package com.examshield.backend;

import com.examshield.backend.config.WebSocketConfig;
import com.examshield.backend.dto.AnswerSubmitRequest;
import com.examshield.backend.dto.ExamCreateRequest;
import com.examshield.backend.dto.ExamSectionDto;
import com.examshield.backend.exception.QuestionPoolLockedException;
import com.examshield.backend.model.*;
import com.examshield.backend.repository.*;
import com.examshield.backend.service.ExamAttemptService;
import com.examshield.backend.service.ExamService;
import com.examshield.backend.service.QuestionService;
import com.examshield.backend.service.RedisTimerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.http.MediaType;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import java.io.ByteArrayOutputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=FALSE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "spring.data.redis.repositories.enabled=false",
    "spring.main.allow-bean-definition-overriding=true"
})
@Transactional
public class ExamIntegrationTest {

    @Autowired
    private ExamService examService;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private ExamAttemptService examAttemptService;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ExamQuestionPoolRepository examQuestionPoolRepository;

    @Autowired
    private ExamAttemptRepository examAttemptRepository;

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    @Autowired
    private WebSocketConfig webSocketConfig;

    @org.springframework.boot.test.context.TestConfiguration
    public static class TestConfig {
        @org.springframework.context.annotation.Bean
        public RedisMessageListenerContainer redisMessageListenerContainer() {
            RedisMessageListenerContainer container = mock(RedisMessageListenerContainer.class);
            org.springframework.data.redis.connection.RedisConnectionFactory factory = 
                mock(org.springframework.data.redis.connection.RedisConnectionFactory.class);
            org.springframework.data.redis.connection.RedisConnection connection = 
                mock(org.springframework.data.redis.connection.RedisConnection.class);
            
            // Mock connection configuration query
            java.util.Properties props = new java.util.Properties();
            props.setProperty("notify-keyspace-events", "Ex");
            when(connection.getConfig("notify-keyspace-events")).thenReturn(props);
            
            when(factory.getConnection()).thenReturn(connection);
            when(container.getConnectionFactory()).thenReturn(factory);
            return container;
        }
    }

    @MockBean
    private StringRedisTemplate redisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    private User admin;
    private User student;
    private Topic topic;

    @BeforeEach
    public void setUp() {
        // Mock Redis value operations
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        doNothing().when(valueOperations).set(anyString(), anyString(), anyLong(), any());

        // Create initial users
        admin = User.builder()
                .fullName("Admin User")
                .email("admin@integration.com")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .isActive(true)
                .build();
        admin = userRepository.save(admin);

        student = User.builder()
                .fullName("Student User")
                .email("student@integration.com")
                .passwordHash("hash")
                .role(UserRole.STUDENT)
                .enrollmentNo("EN2001")
                .isActive(true)
                .build();
        student = userRepository.save(student);

        topic = Topic.builder().name("Calculus").build();
        topic = topicRepository.save(topic);
    }

    @Test
    public void testFullExamStartFlow() {
        // 1. Seed pool questions
        List<Question> poolList = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            poolList.add(questionRepository.save(Question.builder().topic(topic).type(QuestionType.MCQ).questionText("Easy " + i).difficulty(Difficulty.EASY).correctAnswer("A").build()));
            poolList.add(questionRepository.save(Question.builder().topic(topic).type(QuestionType.MCQ).questionText("Medium " + i).difficulty(Difficulty.MEDIUM).correctAnswer("B").build()));
            poolList.add(questionRepository.save(Question.builder().topic(topic).type(QuestionType.MCQ).questionText("Hard " + i).difficulty(Difficulty.HARD).correctAnswer("C").build()));
        }

        // 2. Create draft exam
        ExamCreateRequest request = new ExamCreateRequest();
        request.setTitle("Integration Term Exam");
        request.setStartTime(LocalDateTime.now().plusSeconds(5));
        request.setEndTime(LocalDateTime.now().plusHours(2));
        request.setDurationMinutes(60);
        request.setTotalQuestions(3);
        request.setEasyCount(1);
        request.setMediumCount(1);
        request.setHardCount(1);
        request.setPassingMarks(5);
        request.setIsSectioned(false);

        Exam exam = examService.createExam(request, admin);
        assertNotNull(exam.getId());

        // Add questions to pool
        for (Question q : poolList) {
            examService.addQuestionToPool(exam.getId(), null, q.getId());
        }

        // 3. Publish Exam (locks question pool)
        examService.publishExam(exam.getId());
        Exam published = examRepository.findById(exam.getId()).get();
        assertTrue(published.getIsPublished());

        // 4. Student starts attempt
        // Wait briefly or fake current time check in service, since our start time is now + 5s, let's adjust start time to now
        published.setStartTime(LocalDateTime.now().minusMinutes(1));
        examRepository.save(published);

        ExamAttempt attempt = examAttemptService.startAttempt(published.getId(), student);
        assertNotNull(attempt);
        assertEquals(AttemptStatus.IN_PROGRESS, attempt.getStatus());

        // Verify shuffled sequence persisted in attempt_questions
        List<AttemptQuestion> attemptQuestions = attemptQuestionRepository.findByAttemptIdOrderBySequenceOrderAsc(attempt.getId());
        assertEquals(3, attemptQuestions.size());
        
        long easyCount = attemptQuestions.stream().filter(aq -> aq.getQuestion().getDifficulty() == Difficulty.EASY).count();
        long medCount = attemptQuestions.stream().filter(aq -> aq.getQuestion().getDifficulty() == Difficulty.MEDIUM).count();
        long hardCount = attemptQuestions.stream().filter(aq -> aq.getQuestion().getDifficulty() == Difficulty.HARD).count();
        assertEquals(1, easyCount);
        assertEquals(1, medCount);
        assertEquals(1, hardCount);

        // Verify Redis timer set
        verify(valueOperations, times(1)).set(eq("timer:" + attempt.getId()), eq("ACTIVE"), eq(60L), any());
    }

    @Test
    public void testExamPublishLockThrowsException() {
        ExamCreateRequest request = new ExamCreateRequest();
        request.setTitle("Publish Lock Test");
        request.setStartTime(LocalDateTime.now().plusMinutes(5));
        request.setEndTime(LocalDateTime.now().plusHours(2));
        request.setDurationMinutes(60);
        request.setTotalQuestions(1);
        request.setEasyCount(1);
        request.setPassingMarks(1);

        Exam exam = examService.createExam(request, admin);
        Question q = questionRepository.save(Question.builder().topic(topic).type(QuestionType.MCQ).questionText("Q1").difficulty(Difficulty.EASY).correctAnswer("A").build());
        examService.addQuestionToPool(exam.getId(), null, q.getId());

        examService.publishExam(exam.getId());

        // Attempt to edit draft details should throw Exception
        assertThrows(QuestionPoolLockedException.class, () -> {
            examService.updateExam(exam.getId(), request);
        });

        // Attempt to add question to pool after publish should throw Exception
        assertThrows(QuestionPoolLockedException.class, () -> {
            examService.addQuestionToPool(exam.getId(), null, q.getId());
        });
    }

    @Test
    public void testExcelBulkUploadValidation() throws Exception {
        // Create an Excel Workbook in memory
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Questions");
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Topic Name");
        header.createCell(1).setCellValue("Question Type");
        header.createCell(2).setCellValue("Question Text");
        header.createCell(3).setCellValue("Option A");
        header.createCell(4).setCellValue("Option B");
        header.createCell(5).setCellValue("Option C");
        header.createCell(6).setCellValue("Option D");
        header.createCell(7).setCellValue("Correct Answer");
        header.createCell(8).setCellValue("Difficulty");
        header.createCell(9).setCellValue("Marks");

        // Row 1: Valid MCQ question
        Row r1 = sheet.createRow(1);
        r1.createCell(0).setCellValue("Algebra");
        r1.createCell(1).setCellValue("MCQ");
        r1.createCell(2).setCellValue("What is 2+2?");
        r1.createCell(3).setCellValue("2");
        r1.createCell(4).setCellValue("3");
        r1.createCell(5).setCellValue("4");
        r1.createCell(6).setCellValue("5");
        r1.createCell(7).setCellValue("C");
        r1.createCell(8).setCellValue("EASY");
        r1.createCell(9).setCellValue("1");

        // Row 2: Malformed (MCQ missing options)
        Row r2 = sheet.createRow(2);
        r2.createCell(0).setCellValue("Algebra");
        r2.createCell(1).setCellValue("MCQ");
        r2.createCell(2).setCellValue("What is 3+3?");
        r2.createCell(3).setCellValue("6");
        r2.createCell(7).setCellValue("A"); // Missing options B, C, D
        r2.createCell(8).setCellValue("EASY");

        // Row 3: Malformed (Invalid difficulty enum)
        Row r3 = sheet.createRow(3);
        r3.createCell(0).setCellValue("Geometry");
        r3.createCell(1).setCellValue("SUBJECTIVE");
        r3.createCell(2).setCellValue("Describe pythagorean theorem");
        r3.createCell(8).setCellValue("EXTREME"); // Invalid enum value

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        workbook.write(bos);
        byte[] bytes = bos.toByteArray();
        workbook.close();

        MockMultipartFile file = new MockMultipartFile("file", "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        Map<String, Object> result = questionService.bulkUploadQuestions(file, admin);

        assertEquals(3, result.get("totalRows"));
        assertEquals(1, result.get("successCount")); // 1 valid row successfully saved
        List<?> errors = (List<?>) result.get("errors");
        assertEquals(2, errors.size());
        assertTrue(errors.get(0).toString().contains("Row 3: Validation error - MCQ questions require Options A, B, C, and D."));
        assertTrue(errors.get(1).toString().contains("Row 4: Invalid difficulty 'EXTREME'"));

        // Verify the valid question is actually stored in the database
        Optional<Question> savedQuestion = questionRepository.findAll().stream()
                .filter(q -> "What is 2+2?".equals(q.getQuestionText()))
                .findFirst();
        assertTrue(savedQuestion.isPresent(), "The valid question should be saved to the database");
        assertEquals("Algebra", savedQuestion.get().getTopic().getName());
    }

    @Test
    public void testWebSocketCsrfHandshakeInterceptorAndConnectGuard() {
        // Extract WebSocket interceptor
        ChannelInterceptor interceptor = webSocketConfig.getInboundChannelInterceptor();
        assertNotNull(interceptor);

        // 1. Connection without CSRF Token should throw AccessDeniedException
        StompHeaderAccessor accessorNoCsrf = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<byte[]> messageNoCsrf = MessageBuilder.createMessage(new byte[0], accessorNoCsrf.getMessageHeaders());
        
        assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(messageNoCsrf, mock(MessageChannel.class));
        });

        // 2. Connection with valid CSRF Token
        StompHeaderAccessor accessorWithCsrf = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessorWithCsrf.addNativeHeader("X-XSRF-TOKEN", "real-token");
        // Mock session attribute containing matching CSRF token
        CsrfToken expectedToken = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "real-token");
        accessorWithCsrf.setSessionAttributes(Map.of("CSRF_TOKEN", expectedToken));

        Message<byte[]> messageWithCsrf = MessageBuilder.createMessage(new byte[0], accessorWithCsrf.getMessageHeaders());
        
        assertNotNull(interceptor.preSend(messageWithCsrf, mock(MessageChannel.class))); // should compile and complete successfully
    }

    @Test
    public void testWebSocketSubscriptionOwnershipGuard() {
        ChannelInterceptor interceptor = webSocketConfig.getInboundChannelInterceptor();

        // Seed attempt for student
        Exam exam = examRepository.save(Exam.builder().title("Sub Test").startTime(LocalDateTime.now()).endTime(LocalDateTime.now().plusHours(1)).totalQuestions(1).passingMarks(1).durationMinutes(30).build());
        ExamAttempt attemptB = examAttemptRepository.save(ExamAttempt.builder().exam(exam).student(student).seed("seed").status(AttemptStatus.IN_PROGRESS).build());

        // Create Student A user
        User studentA = userRepository.save(User.builder().fullName("Student A").email("studentA@test.com").passwordHash("hash").role(UserRole.STUDENT).isActive(true).build());

        // Student A attempts to subscribe to Student B's attempt status channel: /topic/attempt/{attemptBId}/status
        StompHeaderAccessor accessorSub = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessorSub.setDestination("/topic/attempt/" + attemptB.getId() + "/status");
        
        // Authenticate as Student A
        accessorSub.setUser(new UsernamePasswordAuthenticationToken(studentA, null, List.of()));

        Message<byte[]> messageSub = MessageBuilder.createMessage(new byte[0], accessorSub.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(messageSub, mock(MessageChannel.class));
        });
    }
}
