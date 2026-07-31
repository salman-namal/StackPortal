package com.stackportal.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateUserRequest {

    @NotBlank
    @Size(min = 2, max = 150)
    private String name;

    @NotBlank
    @Size(min = 3, max = 150)
    private String username;

    @NotBlank
    @Email
    private String email;

    private Boolean active;

    private Set<String> roles;
}

