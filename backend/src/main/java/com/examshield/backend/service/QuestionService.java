package com.examshield.backend.service;

import com.examshield.backend.dto.QuestionCreateRequest;
import com.examshield.backend.dto.AdminQuestionResponseDTO;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.*;
import com.examshield.backend.exception.ResourceNotFoundException;
import com.examshield.backend.repository.QuestionRepository;
import com.examshield.backend.repository.TopicRepository;
import com.examshield.backend.repository.UserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private UserRepository userRepository;

    private Topic getOrCreateTopicFromRequest(QuestionCreateRequest request) {
        if (request.getTopicId() != null) {
            return topicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
        } else if (request.getTopicName() != null && !request.getTopicName().trim().isEmpty()) {
            String cleanName = request.getTopicName().trim();
            return topicRepository.findByName(cleanName)
                    .orElseGet(() -> topicRepository.save(Topic.builder().name(cleanName).build()));
        } else {
            throw new IllegalArgumentException("Either Topic ID or Topic Name is required");
        }
    }

    @Transactional
    public AdminQuestionResponseDTO createQuestion(QuestionCreateRequest request, User creator) {
        Topic topic = getOrCreateTopicFromRequest(request);

        Question question = Question.builder()
                .topic(topic)
                .type(request.getType())
                .questionText(request.getQuestionText())
                .optionA(request.getOptionA())
                .optionB(request.getOptionB())
                .optionC(request.getOptionC())
                .optionD(request.getOptionD())
                .correctAnswer(request.getCorrectAnswer())
                .difficulty(request.getDifficulty())
                .marks(request.getMarks() != null ? request.getMarks() : 1)
                .createdBy(creator)
                .build();

        validateQuestionAnswers(question);

        Question saved = questionRepository.save(question);
        return DtoMapper.toAdminQuestionResponse(saved);
    }

    private void validateQuestionAnswers(Question q) {
        if (q.getType() == QuestionType.MCQ) {
            if (q.getOptionA() == null || q.getOptionB() == null || q.getOptionC() == null || q.getOptionD() == null) {
                throw new IllegalArgumentException("MCQ questions require Options A, B, C, and D.");
            }
            if (q.getCorrectAnswer() == null || !q.getCorrectAnswer().matches("[A-D]")) {
                throw new IllegalArgumentException("MCQ questions require a correct answer: A, B, C, or D.");
            }
        } else if (q.getType() == QuestionType.TRUE_FALSE) {
            if (q.getCorrectAnswer() == null || (!q.getCorrectAnswer().equalsIgnoreCase("TRUE") && !q.getCorrectAnswer().equalsIgnoreCase("FALSE"))) {
                throw new IllegalArgumentException("True/False questions require a correct answer: TRUE or FALSE.");
            }
        }
    }

    @Transactional
    public Map<String, Object> bulkUploadQuestions(MultipartFile file, User creator) {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            return uploadQuestionsFromPdf(file, creator);
        }

        List<String> errors = new ArrayList<>();
        List<Question> questionsToSave = new ArrayList<>();
        int totalRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Topic> cachedTopics = new HashMap<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) {
                    continue; // Skip header
                }
                totalRows++;
                int rowNum = row.getRowNum() + 1;

                try {
                    String topicName = getCellValueAsString(row.getCell(0));
                    String typeStr = getCellValueAsString(row.getCell(1));
                    String questionText = getCellValueAsString(row.getCell(2));
                    String optA = getCellValueAsString(row.getCell(3));
                    String optB = getCellValueAsString(row.getCell(4));
                    String optC = getCellValueAsString(row.getCell(5));
                    String optD = getCellValueAsString(row.getCell(6));
                    String correctAns = getCellValueAsString(row.getCell(7));
                    String diffStr = getCellValueAsString(row.getCell(8));
                    String marksStr = getCellValueAsString(row.getCell(9));

                    if (topicName.isEmpty() || typeStr.isEmpty() || questionText.isEmpty() || diffStr.isEmpty()) {
                        errors.add("Row " + rowNum + ": Topic, Type, Question Text, and Difficulty are mandatory fields.");
                        continue;
                    }

                    // Get or create Topic
                    Topic topic = cachedTopics.computeIfAbsent(topicName.trim().toLowerCase(), name -> {
                        return topicRepository.findByName(topicName.trim())
                                .orElseGet(() -> topicRepository.save(Topic.builder().name(topicName.trim()).build()));
                    });

                    QuestionType type;
                    try {
                        type = QuestionType.valueOf(typeStr.trim().toUpperCase());
                    } catch (Exception e) {
                        errors.add("Row " + rowNum + ": Invalid question type '" + typeStr + "'. Expected MCQ, TRUE_FALSE, or SUBJECTIVE.");
                        continue;
                    }

                    Difficulty difficulty;
                    try {
                        difficulty = Difficulty.valueOf(diffStr.trim().toUpperCase());
                    } catch (Exception e) {
                        errors.add("Row " + rowNum + ": Invalid difficulty '" + diffStr + "'. Expected EASY, MEDIUM, or HARD.");
                        continue;
                    }

                    int marks = 1;
                    if (!marksStr.isEmpty()) {
                        try {
                            marks = (int) Double.parseDouble(marksStr);
                        } catch (Exception e) {
                            errors.add("Row " + rowNum + ": Invalid marks '" + marksStr + "'. Must be an integer.");
                            continue;
                        }
                    }

                    Question q = Question.builder()
                            .topic(topic)
                            .type(type)
                            .questionText(questionText)
                            .optionA(optA.isEmpty() ? null : optA)
                            .optionB(optB.isEmpty() ? null : optB)
                            .optionC(optC.isEmpty() ? null : optC)
                            .optionD(optD.isEmpty() ? null : optD)
                            .correctAnswer(correctAns.isEmpty() ? null : correctAns.trim().toUpperCase())
                            .difficulty(difficulty)
                            .marks(marks)
                            .createdBy(creator)
                            .build();

                    // Run validation rules
                    validateQuestionAnswers(q);
                    questionsToSave.add(q);

                } catch (IllegalArgumentException e) {
                    errors.add("Row " + rowNum + ": Validation error - " + e.getMessage());
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": Processing error - " + e.getMessage());
                }
            }

            if (!questionsToSave.isEmpty()) {
                questionRepository.saveAll(questionsToSave);
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to read Excel workbook: " + e.getMessage(), e);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalRows", totalRows);
        result.put("successCount", questionsToSave.size());
        result.put("errors", errors);
        return result;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        CellType type = cell.getCellType();
        if (type == CellType.STRING) {
            return cell.getStringCellValue().trim();
        } else if (type == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toString();
            }
            // Avoid scientific notation for integer marks or coordinates
            double val = cell.getNumericCellValue();
            if (val == (long) val) {
                return String.format("%d", (long) val);
            }
            return String.valueOf(val);
        } else if (type == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        } else if (type == CellType.FORMULA) {
            try {
                return cell.getStringCellValue().trim();
            } catch (Exception e) {
                return String.valueOf(cell.getNumericCellValue());
            }
        }
        return "";
    }

    public org.springframework.data.domain.Page<AdminQuestionResponseDTO> getQuestions(
            Long topicId, Difficulty difficulty, QuestionType type, String search, org.springframework.data.domain.Pageable pageable) {
        return questionRepository.filterQuestions(topicId, difficulty, type, search, pageable)
                .map(DtoMapper::toAdminQuestionResponse);
    }

    @Transactional
    public AdminQuestionResponseDTO updateQuestion(Long id, QuestionCreateRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        Topic topic = getOrCreateTopicFromRequest(request);

        question.setTopic(topic);
        question.setType(request.getType());
        question.setQuestionText(request.getQuestionText());
        question.setOptionA(request.getOptionA());
        question.setOptionB(request.getOptionB());
        question.setOptionC(request.getOptionC());
        question.setOptionD(request.getOptionD());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setDifficulty(request.getDifficulty());
        question.setMarks(request.getMarks() != null ? request.getMarks() : 1);

        validateQuestionAnswers(question);

        Question saved = questionRepository.save(question);
        return DtoMapper.toAdminQuestionResponse(saved);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question not found");
        }
        questionRepository.deleteById(id);
    }

    private Map<String, Object> uploadQuestionsFromPdf(MultipartFile file, User creator) {
        List<String> errors = new ArrayList<>();
        List<Question> questionsToSave = new ArrayList<>();
        int totalRows = 0;

        try {
            byte[] bytes = file.getBytes();
            String text;
            try (PDDocument document = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                text = stripper.getText(document);
            }

            if (text == null || text.trim().isEmpty()) {
                throw new IllegalArgumentException("PDF file is empty or has no extractable text.");
            }

            // Clean topic from filename
            String defaultTopicName = "General";
            String filename = file.getOriginalFilename();
            if (filename != null) {
                int dot = filename.lastIndexOf('.');
                if (dot > 0) {
                    filename = filename.substring(0, dot);
                }
                String cleanFn = filename.replace('_', ' ').replace('-', ' ').trim();
                String lowerFn = cleanFn.toLowerCase();
                if (lowerFn.contains("java") && !lowerFn.contains("javascript") && !lowerFn.contains("js")) {
                    defaultTopicName = "Java";
                } else if (lowerFn.contains("python")) {
                    defaultTopicName = "Python";
                } else if (lowerFn.contains("javascript") || lowerFn.contains("js")) {
                    defaultTopicName = "JavaScript";
                } else if (lowerFn.contains("operating system") || lowerFn.contains("os")) {
                    defaultTopicName = "Operating Systems";
                } else if (lowerFn.contains("computer network") || lowerFn.contains("cn")) {
                    defaultTopicName = "Computer Networks";
                } else {
                    defaultTopicName = cleanFn;
                }
            }

            String[] lines = text.split("\\r?\\n");
            
            // Temporary builder states
            String topicName = defaultTopicName;
            QuestionType type = null; // null represents not explicitly set
            Difficulty difficulty = null; // null represents not explicitly set
            Integer marks = null; // null represents not explicitly set
            
            StringBuilder qText = new StringBuilder();
            String optA = null;
            String optB = null;
            String optC = null;
            String optD = null;
            String correctAns = null;
            
            // Helper to build and validate a single question
            class QuestionBuilder {
                int count = 0;
                
                void addQuestion(String tName, QuestionType qType, String qTextStr, String a, String b, String c, String d, String ans, Difficulty diff, Integer mks) {
                    if (qTextStr == null || qTextStr.trim().isEmpty()) {
                        return;
                    }
                    count++;
                    try {
                        Topic topic = topicRepository.findByName(tName.trim())
                                .orElseGet(() -> topicRepository.save(Topic.builder().name(tName.trim()).build()));
                        
                        // Default to SUBJECTIVE if options are completely absent
                        QuestionType finalType = qType;
                        if (finalType == null) {
                            if (a == null && b == null && c == null && d == null) {
                                finalType = QuestionType.SUBJECTIVE;
                            } else {
                                finalType = QuestionType.MCQ;
                            }
                        } else if (finalType == QuestionType.MCQ && a == null && b == null && c == null && d == null) {
                            finalType = QuestionType.SUBJECTIVE;
                        }

                        // Round-robin difficulties if not explicitly defined in the document
                        Difficulty finalDiff = diff;
                        if (finalDiff == null) {
                            int idx = count % 3;
                            if (idx == 1) finalDiff = Difficulty.EASY;
                            else if (idx == 2) finalDiff = Difficulty.MEDIUM;
                            else finalDiff = Difficulty.HARD;
                        }

                        int finalMarks = mks != null ? mks : (finalType == QuestionType.SUBJECTIVE ? 5 : 2);
                        
                        // Clean answer and options if MCQ
                        String cleanAns = ans != null ? ans.trim().toUpperCase() : null;
                        if (finalType == QuestionType.MCQ) {
                            if (cleanAns != null && cleanAns.length() > 1) {
                                cleanAns = cleanAns.substring(0, 1);
                            }
                        }
                        
                        Question q = Question.builder()
                                .topic(topic)
                                .type(finalType)
                                .questionText(qTextStr.trim())
                                .optionA(a)
                                .optionB(b)
                                .optionC(c)
                                .optionD(d)
                                .correctAnswer(cleanAns)
                                .difficulty(finalDiff)
                                .marks(finalMarks)
                                .createdBy(creator)
                                .build();
                                
                        validateQuestionAnswers(q);
                        questionsToSave.add(q);
                    } catch (Exception ex) {
                        errors.add("Question " + count + ": " + ex.getMessage());
                    }
                }
            }
            QuestionBuilder builder = new QuestionBuilder();

            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }

                String lower = line.toLowerCase();
                if (lower.startsWith("topic:") || lower.startsWith("subject:")) {
                    builder.addQuestion(topicName, type, qText.toString(), optA, optB, optC, optD, correctAns, difficulty, marks);
                    qText.setLength(0); optA = null; optB = null; optC = null; optD = null; correctAns = null;
                    topicName = line.substring(line.indexOf(":") + 1).trim();
                } else if (lower.startsWith("type:")) {
                    String tStr = line.substring(line.indexOf(":") + 1).trim().toUpperCase();
                    try {
                        type = QuestionType.valueOf(tStr.replace(" ", "_"));
                    } catch (Exception e) {
                        // ignore or default
                    }
                } else if (lower.startsWith("difficulty:") || lower.startsWith("diff:")) {
                    String dStr = line.substring(line.indexOf(":") + 1).trim().toUpperCase();
                    try {
                        difficulty = Difficulty.valueOf(dStr);
                    } catch (Exception e) {
                        // ignore or default
                    }
                } else if (lower.startsWith("marks:")) {
                    try {
                        marks = Integer.parseInt(line.substring(line.indexOf(":") + 1).trim());
                    } catch (Exception e) {
                        // ignore or default
                    }
                } else if (lower.startsWith("question:") || lower.startsWith("q:")) {
                    builder.addQuestion(topicName, type, qText.toString(), optA, optB, optC, optD, correctAns, difficulty, marks);
                    qText.setLength(0); optA = null; optB = null; optC = null; optD = null; correctAns = null;
                    qText.append(line.substring(line.indexOf(":") + 1).trim());
                } else if (lower.startsWith("a:") || lower.startsWith("a)") || lower.startsWith("a.")) {
                    optA = cleanOptionPrefix(line, "a");
                } else if (lower.startsWith("b:") || lower.startsWith("b)") || lower.startsWith("b.")) {
                    optB = cleanOptionPrefix(line, "b");
                } else if (lower.startsWith("c:") || lower.startsWith("c)") || lower.startsWith("c.")) {
                    optC = cleanOptionPrefix(line, "c");
                } else if (lower.startsWith("d:") || lower.startsWith("d)") || lower.startsWith("d.")) {
                    optD = cleanOptionPrefix(line, "d");
                } else if (lower.startsWith("correct:") || lower.startsWith("answer:") || lower.startsWith("correct answer:") || lower.startsWith("ans:")) {
                    correctAns = line.substring(line.indexOf(":") + 1).trim();
                } else {
                    if (line.matches("^\\d+[\\.\\)\\s]+.*") || line.matches("^[qQ]\\d+[\\:\\.\\s]+.*")) {
                        builder.addQuestion(topicName, type, qText.toString(), optA, optB, optC, optD, correctAns, difficulty, marks);
                        qText.setLength(0); optA = null; optB = null; optC = null; optD = null; correctAns = null;
                        
                        String content = line.replaceFirst("^\\d+[\\.\\)\\s]+", "").replaceFirst("^[qQ]\\d+[\\:\\.\\s]+", "").trim();
                        qText.append(content);
                    } else {
                        if (qText.length() > 0 && optA == null && optB == null && optC == null && optD == null && correctAns == null) {
                            qText.append(" ").append(line);
                        }
                    }
                }
            }
            builder.addQuestion(topicName, type, qText.toString(), optA, optB, optC, optD, correctAns, difficulty, marks);
            totalRows = builder.count;

            if (!questionsToSave.isEmpty()) {
                questionRepository.saveAll(questionsToSave);
            }

        } catch (Exception ex) {
            errors.add("Failed to parse PDF: " + ex.getMessage());
            ex.printStackTrace();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalRows", totalRows);
        result.put("successCount", questionsToSave.size());
        result.put("errors", errors);
        return result;
    }

    private String cleanOptionPrefix(String line, String prefix) {
        String content = line.substring(prefix.length()).trim();
        if (content.startsWith(".") || content.startsWith(")") || content.startsWith(":")) {
            content = content.substring(1).trim();
        }
        return content;
    }
}
