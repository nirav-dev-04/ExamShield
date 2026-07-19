package com.examshield.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;

public class RateLimiterServiceTest {

    private RateLimiterService rateLimiterService;

    @BeforeEach
    public void setUp() {
        rateLimiterService = new RateLimiterService();
        // Set capacity to 2 login requests, refill every 60s
        ReflectionTestUtils.setField(rateLimiterService, "loginCapacity", 2);
        ReflectionTestUtils.setField(rateLimiterService, "loginRefillTokens", 2);
        ReflectionTestUtils.setField(rateLimiterService, "loginRefillDuration", 60);

        // Set capacity to 5 answer submissions, refill every 60s
        ReflectionTestUtils.setField(rateLimiterService, "answerCapacity", 5);
        ReflectionTestUtils.setField(rateLimiterService, "answerRefillTokens", 5);
        ReflectionTestUtils.setField(rateLimiterService, "answerRefillDuration", 60);
    }

    @Test
    public void testLoginRateLimitingBlocksAfterCapacityExceeded() {
        String ipAddress = "192.168.1.10";

        // Consume first token: should succeed
        assertTrue(rateLimiterService.tryConsumeLogin(ipAddress));
        // Consume second token: should succeed
        assertTrue(rateLimiterService.tryConsumeLogin(ipAddress));
        // Consume third token: should fail (capacity is 2)
        assertFalse(rateLimiterService.tryConsumeLogin(ipAddress));
    }

    @Test
    public void testIndependentBucketsForDifferentIps() {
        String ip1 = "192.168.1.10";
        String ip2 = "192.168.1.20";

        // Consume capacity for IP 1
        assertTrue(rateLimiterService.tryConsumeLogin(ip1));
        assertTrue(rateLimiterService.tryConsumeLogin(ip1));
        assertFalse(rateLimiterService.tryConsumeLogin(ip1)); // Blocked

        // IP 2 should still be allowed since it has an independent bucket
        assertTrue(rateLimiterService.tryConsumeLogin(ip2));
        assertTrue(rateLimiterService.tryConsumeLogin(ip2));
        assertFalse(rateLimiterService.tryConsumeLogin(ip2)); // Blocked
    }
}
