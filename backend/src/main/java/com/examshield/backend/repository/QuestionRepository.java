package com.examshield.backend.repository;

import com.examshield.backend.model.Difficulty;
import com.examshield.backend.model.Question;
import com.examshield.backend.model.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByTopicIdAndDifficulty(Long topicId, Difficulty difficulty);
    List<Question> findByDifficulty(Difficulty difficulty);
    List<Question> findByTopicId(Long topicId);

    @Query("SELECT q FROM Question q WHERE " +
           "(:topicId IS NULL OR q.topic.id = :topicId) AND " +
           "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
           "(:type IS NULL OR q.type = :type) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(q.questionText) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Question> filterQuestions(
        @Param("topicId") Long topicId,
        @Param("difficulty") Difficulty difficulty,
        @Param("type") QuestionType type,
        @Param("search") String search,
        Pageable pageable
    );
}
