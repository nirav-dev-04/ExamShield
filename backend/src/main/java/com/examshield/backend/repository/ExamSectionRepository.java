package com.examshield.backend.repository;

import com.examshield.backend.model.ExamSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamSectionRepository extends JpaRepository<ExamSection, Long> {
    List<ExamSection> findByExamId(Long examId);
}
