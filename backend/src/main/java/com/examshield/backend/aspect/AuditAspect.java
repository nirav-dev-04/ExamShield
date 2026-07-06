package com.examshield.backend.aspect;

import com.examshield.backend.model.User;
import com.examshield.backend.service.AuditLogService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class AuditAspect {

    @Autowired
    private AuditLogService auditLogService;

    @AfterReturning(pointcut = "@annotation(auditable)", returning = "result")
    public void logAuditAction(JoinPoint joinPoint, Auditable auditable, Object result) {
        Object principal = null;
        try {
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            }
        } catch (Exception e) {
            // Context might not be available (e.g. background job/websocket)
        }

        User actor = null;
        if (principal instanceof User) {
            actor = (User) principal;
        }

        String action = auditable.action();
        Long entityId = null;
        String entityType = null;

        // Attempt to extract entityId from arguments (first argument if it's a Long or if it is named id/examId)
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        Map<String, Object> details = new HashMap<>();

        if (parameterNames != null && args != null) {
            for (int i = 0; i < parameterNames.length; i++) {
                String paramName = parameterNames[i];
                Object paramVal = args[i];

                if (paramVal != null) {
                    details.put(paramName, paramVal.toString());

                    if (entityId == null && (paramName.equalsIgnoreCase("id") 
                            || paramName.equalsIgnoreCase("examId") 
                            || paramName.equalsIgnoreCase("attemptId")) 
                            && paramVal instanceof Long) {
                        entityId = (Long) paramVal;
                        entityType = paramName.replace("Id", "").toUpperCase();
                    }
                }
            }
        }

        if (result != null) {
            details.put("status", "SUCCESS");
        }

        auditLogService.log(actor, action, entityType, entityId, details);
    }
}
