package com.stackportal.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticatedUserResponse {
    private Long id;
    private String name;
    private String email;
    private Set<String> roles;
    private boolean emailVerified;
}
