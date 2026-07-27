package com.stackportal.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendVerificationRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email format")
    private String email;
}
