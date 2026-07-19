package com.examshield.backend.repository;

import com.examshield.backend.model.AttemptQuestion;
import com.examshield.backend.model.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttemptQuestionRepository extends JpaRepository<AttemptQuestion, Long> {
    List<AttemptQuestion> findByAttemptIdOrderBySequenceOrderAsc(Long attemptId);
    Optional<AttemptQuestion> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);

    @Query("SELECT aq FROM AttemptQuestion aq JOIN aq.attempt a JOIN aq.question q " +
           "WHERE a.exam.id = :examId AND q.type = :type AND aq.gradedBy IS NULL AND a.status IN ('SUBMITTED', 'AUTO_SUBMITTED')")
    List<AttemptQuestion> findUngradedSubjectiveQuestions(@Param("examId") Long examId, @Param("type") QuestionType type);
}
