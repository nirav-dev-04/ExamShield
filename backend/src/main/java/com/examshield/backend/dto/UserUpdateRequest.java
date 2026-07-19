package com.examshield.backend.dto;

import com.examshield.backend.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserUpdateRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String password; // optional

    @NotNull(message = "Role is required")
    private UserRole role;

    private String enrollmentNo;

    public UserUpdateRequest() {}

    public UserUpdateRequest(String fullName, String email, String password, UserRole role, String enrollmentNo) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.enrollmentNo = enrollmentNo;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getEnrollmentNo() {
        return enrollmentNo;
    }

    public void setEnrollmentNo(String enrollmentNo) {
        this.enrollmentNo = enrollmentNo;
    }
}
