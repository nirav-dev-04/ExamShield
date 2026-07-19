package com.examshield.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Service
public class RedisTimerService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final String TIMER_KEY_PREFIX = "timer:";

    public void startTimer(Long attemptId, int durationMinutes) {
        String key = TIMER_KEY_PREFIX + attemptId;
        redisTemplate.opsForValue().set(key, "ACTIVE", durationMinutes, TimeUnit.MINUTES);
    }

    public Long getRemainingSeconds(Long attemptId) {
        String key = TIMER_KEY_PREFIX + attemptId;
        Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return expire == null ? -1L : expire;
    }

    public void cancelTimer(Long attemptId) {
        String key = TIMER_KEY_PREFIX + attemptId;
        redisTemplate.delete(key);
    }
}
