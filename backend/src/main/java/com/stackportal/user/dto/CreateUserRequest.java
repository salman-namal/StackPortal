package com.stackportal.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class CreateUserRequest {

    @NotBlank
    @Size(min = 2, max = 150)
    private String name;

    @NotBlank
    @Size(min = 3, max = 150)
    private String username;

    @NotBlank
    @Email
    private String email;

    @Size(min = 8, max = 100)
    private String password;

    private Set<String> roles;
}

