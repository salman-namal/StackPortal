package com.stackportal.user.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private boolean active;
    private boolean emailVerified;
    private Instant createdAt;
    private Instant updatedAt;
    private Set<String> roles;
}

