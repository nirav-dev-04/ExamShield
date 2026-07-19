package com.examshield.backend.repository;

import com.examshield.backend.model.AttemptStatus;
import com.examshield.backend.model.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {
    Optional<ExamAttempt> findByExamIdAndStudentId(Long examId, Long studentId);
    List<ExamAttempt> findByExamId(Long examId);
    List<ExamAttempt> findByExamIdAndStatus(Long examId, AttemptStatus status);
    List<ExamAttempt> findByStatus(AttemptStatus status);
    List<ExamAttempt> findByStudentId(Long studentId);
}
