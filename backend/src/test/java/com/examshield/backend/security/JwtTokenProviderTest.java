package com.examshield.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String testSecret = "ZXhhbXNoaWVsZHNlY3JldGtleW11c3RiZWxvbmdlbm91Z2hhbmRzZWN1cmV0b2F2b2lkand0c2lnbmluZ2V4Y2VwdGlvbnMyMDI2IQ==";

    @BeforeEach
    public void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationInMs", 900000L); // 15 mins
        ReflectionTestUtils.setField(tokenProvider, "refreshExpirationInMs", 604800000L); // 7 days
        ReflectionTestUtils.setField(tokenProvider, "cookieName", "ES_ACCESS_TOKEN");
        ReflectionTestUtils.setField(tokenProvider, "refreshCookieName", "ES_REFRESH_TOKEN");
    }

    @Test
    public void testGenerateAndValidateValidToken() {
        String email = "test@examshield.com";
        String role = "STUDENT";

        String token = tokenProvider.generateAccessToken(email, role);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals(email, tokenProvider.getUsernameFromJwt(token));
        assertEquals(role, tokenProvider.getRoleFromJwt(token));
    }

    @Test
    public void testExpiredTokenFailsValidation() {
        // Set short expiration of -5 seconds (already expired)
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationInMs", -5000L);
        
        String token = tokenProvider.generateAccessToken("expired@examshield.com", "STUDENT");

        assertNotNull(token);
        assertFalse(tokenProvider.validateToken(token));
    }

    @Test
    public void testMalformedOrTamperedTokenFailsValidation() {
        String token = tokenProvider.generateAccessToken("user@examshield.com", "STUDENT");
        
        // Tamper with the signature by appending garbage characters
        String tamperedToken = token + "xyz";

        assertFalse(tokenProvider.validateToken(tamperedToken));
        assertFalse(tokenProvider.validateToken("invalid-header.invalid-payload.invalid-signature"));
    }
}
