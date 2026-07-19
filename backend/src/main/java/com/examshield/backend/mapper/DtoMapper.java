package com.examshield.backend.mapper;

import com.examshield.backend.dto.*;
import com.examshield.backend.model.*;
import java.util.List;
import java.util.stream.Collectors;

public class DtoMapper {

    public static UserResponseDTO toUserResponse(User user) {
        if (user == null) return null;
        return UserResponseDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .enrollmentNo(user.getEnrollmentNo())
                .isActive(user.getIsActive())
                .build();
    }

    public static QuestionResponseDTO toQuestionResponse(AttemptQuestion aq) {
        if (aq == null) return null;
        Question question = aq.getQuestion();
        
        QuestionResponseDTO.Builder builder = QuestionResponseDTO.builder()
                .id(question.getId())
                .topicId(question.getTopic() != null ? question.getTopic().getId() : null)
                .topicName(question.getTopic() != null ? question.getTopic().getName() : null)
                .type(question.getType())
                .questionText(question.getQuestionText())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .difficulty(question.getDifficulty())
                .marks(question.getMarks())
                .sequenceOrder(aq.getSequenceOrder());

        AttemptStatus status = aq.getAttempt().getStatus();
        if (status == AttemptStatus.SUBMITTED || status == AttemptStatus.AUTO_SUBMITTED || status == AttemptStatus.SUSPENDED) {
            builder.studentAnswer(aq.getStudentAnswer());
            builder.correctAnswer(question.getCorrectAnswer());
            builder.isCorrect(aq.getIsCorrect());
            builder.marksAwarded(aq.getMarksAwarded());
        } else {
            builder.studentAnswer(aq.getStudentAnswer());
        }

        return builder.build();
    }

    public static AdminQuestionResponseDTO toAdminQuestionResponse(Question question) {
        if (question == null) return null;
        return AdminQuestionResponseDTO.builder()
                .id(question.getId())
                .topicId(question.getTopic() != null ? question.getTopic().getId() : null)
                .topicName(question.getTopic() != null ? question.getTopic().getName() : null)
                .type(question.getType())
                .questionText(question.getQuestionText())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .correctAnswer(question.getCorrectAnswer())
                .difficulty(question.getDifficulty())
                .marks(question.getMarks())
                .build();
    }

    public static ExamAttemptResponseDTO toExamAttemptResponse(ExamAttempt attempt, Long remainingSeconds) {
        if (attempt == null) return null;

        List<QuestionResponseDTO> questionDtos = attempt.getAttemptQuestions().stream()
                .map(aq -> toQuestionResponse(aq))
                .collect(Collectors.toList());

        return ExamAttemptResponseDTO.builder()
                .id(attempt.getId())
                .examId(attempt.getExam().getId())
                .examTitle(attempt.getExam().getTitle())
                .studentName(attempt.getStudent().getFullName())
                .status(attempt.getStatus().name())
                .startedAt(attempt.getStartedAt())
                .durationMinutes(attempt.getExam().getDurationMinutes())
                .remainingSeconds(remainingSeconds)
                .questions(questionDtos)
                .violationsCount(attempt.getViolations().size())
                .totalScore(attempt.getTotalScore())
                .rank(attempt.getRank())
                .proctorNotes(attempt.getProctorNotes())
                .build();
    }

    public static ViolationResponseDTO toViolationResponse(Violation violation) {
        if (violation == null) return null;
        return ViolationResponseDTO.builder()
                .id(violation.getId())
                .studentName(violation.getAttempt().getStudent().getFullName())
                .enrollmentNo(violation.getAttempt().getStudent().getEnrollmentNo())
                .type(violation.getType().name())
                .occurredAt(violation.getOccurredAt())
                .attemptId(violation.getAttempt().getId())
                .examId(violation.getAttempt().getExam().getId())
                .build();
    }
}
