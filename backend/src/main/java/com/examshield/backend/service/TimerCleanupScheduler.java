package com.examshield.backend.service;

import com.examshield.backend.model.AttemptStatus;
import com.examshield.backend.model.ExamAttempt;
import com.examshield.backend.repository.ExamAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Component
@EnableScheduling
public class TimerCleanupScheduler {

    @Autowired
    private ExamAttemptRepository examAttemptRepository;

    @Autowired
    private ExamAttemptService examAttemptService;

    // Runs every 1 minute (60,000 milliseconds)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void sweepExpiredAttempts() {
        // Query directly from database by IN_PROGRESS status (production-grade query pattern)
        List<ExamAttempt> activeAttempts = examAttemptRepository.findByStatus(AttemptStatus.IN_PROGRESS);

        LocalDateTime now = LocalDateTime.now();

        for (ExamAttempt attempt : activeAttempts) {
            LocalDateTime startTime = attempt.getStartedAt() != null ? attempt.getStartedAt() : LocalDateTime.now(); // fallback
            int duration = attempt.getExam().getDurationMinutes();
            
            // Add a 2-minute buffer to ensure we don't conflict with active Redis timers
            LocalDateTime expirationTimeWithBuffer = startTime.plusMinutes(duration).plusMinutes(2);

            if (now.isAfter(expirationTimeWithBuffer)) {
                try {
                    System.out.println("Failsafe Scheduler: Auto-submitting expired attempt ID " + attempt.getId());
                    examAttemptService.autoSubmitAttempt(attempt.getId());
                } catch (Exception e) {
                    System.err.println("Failsafe Scheduler failed to auto-submit attempt ID " + attempt.getId() + ". Error: " + e.getMessage());
                }
            }
        }
    }
}
