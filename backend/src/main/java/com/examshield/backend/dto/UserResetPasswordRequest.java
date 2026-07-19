package com.examshield.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserResetPasswordRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String enrollmentNo;

    @NotBlank(message = "New password is required")
    private String newPassword;

    private String staffVerificationCode;

    public UserResetPasswordRequest() {}

    public UserResetPasswordRequest(String email, String enrollmentNo, String newPassword, String staffVerificationCode) {
        this.email = email;
        this.enrollmentNo = enrollmentNo;
        this.newPassword = newPassword;
        this.staffVerificationCode = staffVerificationCode;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEnrollmentNo() {
        return enrollmentNo;
    }

    public void setEnrollmentNo(String enrollmentNo) {
        this.enrollmentNo = enrollmentNo;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getStaffVerificationCode() {
        return staffVerificationCode;
    }

    public void setStaffVerificationCode(String staffVerificationCode) {
        this.staffVerificationCode = staffVerificationCode;
    }
}
