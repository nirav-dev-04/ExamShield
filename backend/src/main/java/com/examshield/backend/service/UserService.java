package com.examshield.backend.service;

import com.examshield.backend.dto.UserLoginRequest;
import com.examshield.backend.dto.UserRegisterRequest;
import com.examshield.backend.dto.UserResponseDTO;
import com.examshield.backend.mapper.DtoMapper;
import com.examshield.backend.model.User;
import com.examshield.backend.repository.UserRepository;
import com.examshield.backend.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

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
                .role(request.getRole())
                .enrollmentNo(request.getEnrollmentNo())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        return DtoMapper.toUserResponse(savedUser);
    }

    public UserResponseDTO login(UserLoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        // Add cookies to response
        tokenProvider.addJwtCookiesToResponse(response, accessToken, refreshToken);

        return DtoMapper.toUserResponse(user);
    }

    public void logout(HttpServletResponse response) {
        tokenProvider.clearJwtCookies(response);
    }
}
