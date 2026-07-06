package com.examshield.backend.dto;

import com.examshield.backend.model.UserRole;

public class UserResponseDTO {
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private String enrollmentNo;
    private Boolean isActive;

    public UserResponseDTO() {}

    public UserResponseDTO(Long id, String fullName, String email, UserRole role, String enrollmentNo, Boolean isActive) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.enrollmentNo = enrollmentNo;
        this.isActive = isActive;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String fullName;
        private String email;
        private UserRole role;
        private String enrollmentNo;
        private Boolean isActive;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder role(UserRole role) {
            this.role = role;
            return this;
        }

        public Builder enrollmentNo(String enrollmentNo) {
            this.enrollmentNo = enrollmentNo;
            return this;
        }

        public Builder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public UserResponseDTO build() {
            return new UserResponseDTO(id, fullName, email, role, enrollmentNo, isActive);
        }
    }
}
