package com.examshield.backend.service;

import com.examshield.backend.dto.QuestionCreateRequest;
import com.examshield.backend.dto.AdminQuestionResponseDTO;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.*;
import com.examshield.backend.repository.QuestionRepository;
import com.examshield.backend.repository.TopicRepository;
import com.examshield.backend.repository.UserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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

    @Transactional
    public AdminQuestionResponseDTO createQuestion(QuestionCreateRequest request, User creator) {
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));

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
}
