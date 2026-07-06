package com.examshield.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Component
public class RedisExpirationListener extends KeyExpirationEventMessageListener {

    @Autowired
    private ExamAttemptService examAttemptService;

    public RedisExpirationListener(RedisMessageListenerContainer listenerContainer) {
        super(listenerContainer);
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        // Redis key prefix is "timer:{attemptId}"
        if (expiredKey.startsWith("timer:")) {
            try {
                String[] parts = expiredKey.split(":");
                if (parts.length > 1) {
                    Long attemptId = Long.parseLong(parts[1]);
                    examAttemptService.autoSubmitAttempt(attemptId);
                }
            } catch (Exception e) {
                // Log failed auto-submit
                System.err.println("Failed to auto-submit attempt on key expiration: " + expiredKey + ". Error: " + e.getMessage());
            }
        }
    }
}
