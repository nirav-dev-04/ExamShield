package com.examshield.backend.repository;

import com.examshield.backend.model.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findByAttemptIdOrderByOccurredAtDesc(Long attemptId);
    List<Violation> findByAttemptExamIdAndOccurredAtAfterOrderByOccurredAtAsc(Long examId, LocalDateTime timestamp);
    List<Violation> findTop10ByOrderByOccurredAtDesc();
    long countByAttemptId(Long attemptId);
}
