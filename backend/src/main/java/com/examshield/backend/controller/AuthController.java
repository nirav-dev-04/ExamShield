package com.examshield.backend.controller;

import com.examshield.backend.dto.UserLoginRequest;
import com.examshield.backend.dto.UserRegisterRequest;
import com.examshield.backend.dto.UserResponseDTO;
import com.examshield.backend.dto.UserResetPasswordRequest;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.User;
import com.examshield.backend.security.RateLimiterService;
import com.examshield.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody UserResetPasswordRequest request) {
        try {
            userService.resetPassword(request);
            return ResponseEntity.ok(Collections.singletonMap("message", "Password reset successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", ex.getMessage()));
        }
    }

    @Autowired
    private UserService userService;

    @Autowired
    private RateLimiterService rateLimiterService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(@Valid @RequestBody UserRegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserLoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String ip = httpRequest.getRemoteAddr();
        
        // Apply Bucket4j rate limit check
        if (!rateLimiterService.tryConsumeLogin(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Collections.singletonMap("message", "Too many login attempts. Please try again after a minute."));
        }

        try {
            UserResponseDTO response = userService.login(request, httpResponse);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", ex.getMessage()));
        }
    }

    @Autowired
    private com.examshield.backend.repository.RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private com.examshield.backend.security.JwtTokenProvider tokenProvider;

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        userService.logout(request, response);
        return ResponseEntity.ok(Collections.singletonMap("message", "Logged out successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenString = tokenProvider.getRefreshTokenFromCookie(request);
        if (refreshTokenString == null || refreshTokenString.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Refresh token missing"));
        }

        String hashedToken = com.examshield.backend.security.TokenHasher.hashToken(refreshTokenString);
        com.examshield.backend.model.RefreshToken tokenEntity = refreshTokenRepository.findByToken(hashedToken)
                .orElse(null);

        if (tokenEntity == null || tokenEntity.getRevoked() || tokenEntity.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            tokenProvider.clearJwtCookies(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid or expired refresh token"));
        }

        User user = tokenEntity.getUser();
        if (user == null || !user.getIsActive()) {
            tokenProvider.clearJwtCookies(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "User is inactive or not found"));
        }

        // ROTATION: Revoke old token
        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);

        // Issue new access token
        String newAccessToken = tokenProvider.generateAccessToken(user.getEmail(), user.getRole().name());
        tokenProvider.addAccessTokenCookie(response, newAccessToken);

        // Issue new refresh token (Rotate)
        String newRefreshTokenString = java.util.UUID.randomUUID().toString();
        String newHashedToken = com.examshield.backend.security.TokenHasher.hashToken(newRefreshTokenString);
        java.time.LocalDateTime newExpiresAt = java.time.LocalDateTime.now().plusDays(30);

        com.examshield.backend.model.RefreshToken newRefreshTokenEntity = new com.examshield.backend.model.RefreshToken(
            user, newHashedToken, newExpiresAt
        );
        refreshTokenRepository.save(newRefreshTokenEntity);
        tokenProvider.addRefreshTokenCookie(response, newRefreshTokenString);

        return ResponseEntity.ok(DtoMapper.toUserResponse(user));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Not authenticated"));
        }
        return ResponseEntity.ok(DtoMapper.toUserResponse(currentUser));
    }
}
