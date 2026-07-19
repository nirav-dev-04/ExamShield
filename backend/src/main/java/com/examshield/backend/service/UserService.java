package com.examshield.backend.service;

import com.examshield.backend.dto.UserLoginRequest;
import com.examshield.backend.dto.UserRegisterRequest;
import com.examshield.backend.dto.UserResponseDTO;
import com.examshield.backend.dto.UserResetPasswordRequest;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.User;
import com.examshield.backend.repository.UserRepository;
import com.examshield.backend.security.JwtTokenProvider;
import com.examshield.backend.repository.RefreshTokenRepository;
import com.examshield.backend.model.RefreshToken;
import com.examshield.backend.security.TokenHasher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Transactional
    public void resetPassword(UserResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No account registered with this email address."));

        if (!user.getIsActive()) {
            throw new IllegalArgumentException("This account has been deactivated. Please contact support.");
        }

        if (com.examshield.backend.model.UserRole.STUDENT.equals(user.getRole())) {
            if (request.getEnrollmentNo() == null || request.getEnrollmentNo().isBlank()) {
                throw new IllegalArgumentException("Enrollment number is required for students.");
            }
            if (!request.getEnrollmentNo().trim().equalsIgnoreCase(user.getEnrollmentNo())) {
                throw new IllegalArgumentException("Enrollment number does not match our records.");
            }
        } else {
            // Proctor, Admin, Super Admin require a verification override
            if (request.getStaffVerificationCode() == null || request.getStaffVerificationCode().isBlank()) {
                throw new IllegalArgumentException("Staff security PIN is required for staff members.");
            }
            String code = request.getStaffVerificationCode().trim();
            if (!code.equals("ldrp") && !code.equals("12345")) {
                throw new IllegalArgumentException("Invalid staff security override PIN.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public UserResponseDTO register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(com.examshield.backend.model.UserRole.STUDENT)
                .enrollmentNo(request.getEnrollmentNo())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        return DtoMapper.toUserResponse(savedUser);
    }

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    public UserResponseDTO login(UserLoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // 1. Generate access token
        String accessToken = tokenProvider.generateAccessToken(user.getEmail(), user.getRole().name());
        tokenProvider.addAccessTokenCookie(response, accessToken);

        // 2. Generate refresh token if rememberMe is enabled
        if (Boolean.TRUE.equals(request.getRememberMe())) {
            String refreshTokenString = java.util.UUID.randomUUID().toString();
            String hashedToken = TokenHasher.hashToken(refreshTokenString);
            
            java.time.LocalDateTime expiresAt = java.time.LocalDateTime.now().plusDays(30);
            
            RefreshToken refreshTokenEntity = new RefreshToken(
                user, hashedToken, expiresAt
            );
            refreshTokenRepository.save(refreshTokenEntity);
            
            tokenProvider.addRefreshTokenCookie(response, refreshTokenString);
        } else {
            // Clear any existing refresh cookie if not using rememberMe
            ResponseCookie clearRefresh = ResponseCookie.from(tokenProvider.getRefreshCookieName(), "")
                    .httpOnly(true)
                    .path("/")
                    .maxAge(0)
                    .build();
            response.addHeader("Set-Cookie", clearRefresh.toString());
        }

        return DtoMapper.toUserResponse(user);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenString = tokenProvider.getRefreshTokenFromCookie(request);
        if (refreshTokenString != null && !refreshTokenString.isBlank()) {
            String hashedToken = TokenHasher.hashToken(refreshTokenString);
            refreshTokenRepository.findByToken(hashedToken).ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
        }
        tokenProvider.clearJwtCookies(response);
    }
}
