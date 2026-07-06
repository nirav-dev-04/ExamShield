package com.examshield.backend.service;

import com.examshield.backend.model.AuditLog;
import com.examshield.backend.model.User;
import com.examshield.backend.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public void log(User actor, String action, String entityType, Long entityId, Object details) {
        String detailsJson = null;
        try {
            if (details != null) {
                detailsJson = objectMapper.writeValueAsString(details);
            }
        } catch (Exception e) {
            detailsJson = "{\"error\":\"Could not serialize details\"}";
        }

        AuditLog log = AuditLog.builder()
                .actor(actor)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(detailsJson)
                .build();

        auditLogRepository.save(log);
    }
}
