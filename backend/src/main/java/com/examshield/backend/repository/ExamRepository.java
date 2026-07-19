package com.examshield.backend.repository;

import com.examshield.backend.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByProctorsId(Long proctorId);
    List<Exam> findByIsPublishedTrue();
    List<Exam> findByIsPublishedTrueAndStudentsId(Long studentId);
}
