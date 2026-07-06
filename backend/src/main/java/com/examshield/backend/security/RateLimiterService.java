package com.examshield.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> answerBuckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.login.capacity}")
    private int loginCapacity;

    @Value("${app.rate-limit.login.refill-tokens}")
    private int loginRefillTokens;

    @Value("${app.rate-limit.login.refill-duration-seconds}")
    private int loginRefillDuration;

    @Value("${app.rate-limit.answer-submit.capacity}")
    private int answerCapacity;

    @Value("${app.rate-limit.answer-submit.refill-tokens}")
    private int answerRefillTokens;

    @Value("${app.rate-limit.answer-submit.refill-duration-seconds}")
    private int answerRefillDuration;

    private Bucket createNewLoginBucket() {
        Refill refill = Refill.intervally(loginRefillTokens, Duration.ofSeconds(loginRefillDuration));
        Bandwidth limit = Bandwidth.classic(loginCapacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createNewAnswerBucket() {
        Refill refill = Refill.intervally(answerRefillTokens, Duration.ofSeconds(answerRefillDuration));
        Bandwidth limit = Bandwidth.classic(answerCapacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    public boolean tryConsumeLogin(String ipAddress) {
        Bucket bucket = loginBuckets.computeIfAbsent(ipAddress, k -> createNewLoginBucket());
        return bucket.tryConsume(1);
    }

    public boolean tryConsumeAnswer(String attemptIdAndIp) {
        Bucket bucket = answerBuckets.computeIfAbsent(attemptIdAndIp, k -> createNewAnswerBucket());
        return bucket.tryConsume(1);
    }
}
