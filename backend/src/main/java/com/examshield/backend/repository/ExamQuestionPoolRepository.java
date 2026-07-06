package com.examshield.backend.repository;

import com.examshield.backend.model.ExamQuestionPool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamQuestionPoolRepository extends JpaRepository<ExamQuestionPool, Long> {
    List<ExamQuestionPool> findByExamId(Long examId);
    List<ExamQuestionPool> findByExamIdAndSectionId(Long examId, Long sectionId);
    boolean existsByExamIdAndQuestionId(Long examId, Long questionId);
    void deleteByExamId(Long examId);
}
