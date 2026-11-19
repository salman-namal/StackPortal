package com.stackportal.service.auth;

import com.stackportal.common.exception.ApiException;
import com.stackportal.common.response.ApiResponse;
import com.stackportal.dto.request.auth.LoginRequest;
import com.stackportal.dto.response.auth.AuthenticatedUserResponse;
import com.stackportal.dto.response.auth.LoginResponse;
import com.stackportal.entity.master.PlatformUser;
import com.stackportal.repository.master.PlatformUserRepository;
import com.stackportal.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/** Authentication for platform-only identities. No tenant datasource is used here. */
@Service
@RequiredArgsConstructor
public class PlatformAuthService {
    private final PlatformUserRepository platformUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ApiResponse<LoginResponse> login(LoginRequest request) {
        PlatformUser user = platformUserRepository
                .findByEmailIgnoreCaseOrUsernameIgnoreCase(request.getEmail(), request.getEmail())
                .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED));
        if (!user.isEnabled()) throw new ApiException("Platform account is inactive", HttpStatus.FORBIDDEN);
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        Set<String> roles = Set.of("SUPER_ADMIN");
        Map<String, Object> claims = Map.of("scope", "PLATFORM", "roles", roles, "userId", user.getId());
        LoginResponse response = LoginResponse.builder()
                .accessToken(jwtService.generateAccessToken(user.getEmail(), claims))
                .refreshToken(jwtService.generateRefreshToken(user.getEmail(), Map.of("scope", "PLATFORM")))
                .tokenType("Bearer")
                .user(AuthenticatedUserResponse.builder().id(user.getId()).name(user.getName()).email(user.getEmail())
                        .username(user.getUsername()).roles(roles).emailVerified(true).build())
                .build();
        return ApiResponse.ok("Platform authentication successful", response);
    }
}

