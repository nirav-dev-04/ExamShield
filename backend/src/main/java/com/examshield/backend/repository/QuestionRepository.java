package com.examshield.backend.repository;

import com.examshield.backend.model.Difficulty;
import com.examshield.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByTopicIdAndDifficulty(Long topicId, Difficulty difficulty);
    List<Question> findByDifficulty(Difficulty difficulty);
}
