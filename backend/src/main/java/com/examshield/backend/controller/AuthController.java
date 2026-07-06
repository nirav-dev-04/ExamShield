package com.examshield.backend.controller;

import com.examshield.backend.dto.UserLoginRequest;
import com.examshield.backend.dto.UserRegisterRequest;
import com.examshield.backend.dto.UserResponseDTO;
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

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        userService.logout(response);
        return ResponseEntity.ok(Collections.singletonMap("message", "Logged out successfully"));
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
