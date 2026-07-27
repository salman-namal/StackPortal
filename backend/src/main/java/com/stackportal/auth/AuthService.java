package com.stackportal.auth;

import com.stackportal.auth.dto.*;
import com.stackportal.common.ApiResponse;
import com.stackportal.exception.ApiException;
import com.stackportal.security.JwtService;
import com.stackportal.token.*;
import com.stackportal.user.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final GoogleOAuth2Service googleOAuth2Service;

    @Value("${server.port:8080}")
    private int serverPort;

    @Transactional
    public ApiResponse<Void> register(RegisterRequest request, String appBaseUrl) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already in use", HttpStatus.BAD_REQUEST);
        }

        Role userRole = roleRepository.findByRoleName(RoleName.USER)
                .orElseThrow(() -> new ApiException("Default USER role not configured", HttpStatus.INTERNAL_SERVER_ERROR));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .active(false)
                .emailVerified(false)
                .roles(new HashSet<>(Collections.singletonList(userRole)))
                .build();
        userRepository.save(user);

        String otpCode = generateOtp();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .token(otpCode)
                .user(user)
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .used(false)
                .build();
        emailVerificationTokenRepository.save(token);

        emailService.sendEmailVerification(request.getEmail(), otpCode);

        return ApiResponse.ok("Registration successful. Please check your email for the verification code.", null);
    }

    public ApiResponse<AuthResponse> login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED));

        if (!user.isEnabled()) {
            throw new ApiException("Account is not active or email not verified", HttpStatus.FORBIDDEN);
        }

        return buildAuthResponse(user);
    }

    public ApiResponse<AuthResponse> refreshToken(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new ApiException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Refresh token expired or revoked", HttpStatus.UNAUTHORIZED);
        }

        User user = token.getUser();
        return buildAuthResponse(user);
    }

    @Transactional
    public ApiResponse<Void> logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
        return ApiResponse.ok("Logged out successfully", null);
    }

    @Transactional
    public ApiResponse<Void> verifyEmail(String tokenValue) {
        EmailVerificationToken token = emailVerificationTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ApiException("Invalid verification code", HttpStatus.BAD_REQUEST));

        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Verification code expired or already used", HttpStatus.BAD_REQUEST);
        }

        User user = token.getUser();
        user.setEmailVerified(true);
        user.setActive(true);
        userRepository.save(user);

        emailVerificationTokenRepository.delete(token);

        return ApiResponse.ok("Email verified successfully", null);
    }

    @Transactional
    public ApiResponse<Void> resendVerification(ResendVerificationRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new ApiException("Email is already verified", HttpStatus.BAD_REQUEST);
        }

        emailVerificationTokenRepository.deleteByUser(user);

        String otpCode = generateOtp();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .token(otpCode)
                .user(user)
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .used(false)
                .build();
        emailVerificationTokenRepository.save(token);

        emailService.sendEmailVerification(user.getEmail(), otpCode);

        return ApiResponse.ok("A new verification code has been sent to your email.", null);
    }

    @Transactional
    public ApiResponse<Void> forgotPassword(ForgotPasswordRequest request, String appBaseUrl) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        String tokenValue = UUID.randomUUID().toString();
        PasswordResetToken token = PasswordResetToken.builder()
                .token(tokenValue)
                .user(user)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(false)
                .build();
        passwordResetTokenRepository.save(token);

        String resetLink = appBaseUrl + "/reset-password?token=" + tokenValue;
        emailService.sendPasswordReset(user.getEmail(), resetLink);

        return ApiResponse.ok("Password reset link sent to email", null);
    }

    @Transactional
    public ApiResponse<Void> resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ApiException("Invalid reset token", HttpStatus.BAD_REQUEST));

        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Reset token expired or already used", HttpStatus.BAD_REQUEST);
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        return ApiResponse.ok("Password reset successfully", null);
    }

    @Transactional
    public ApiResponse<AuthResponse> loginWithGoogle(GoogleLoginRequest request) {
        GoogleUserInfo googleUser = googleOAuth2Service.verifyIdToken(request.getIdToken());
        if (googleUser == null || googleUser.getEmail() == null) {
            throw new ApiException("Invalid Google token", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findByEmail(googleUser.getEmail())
                .orElseGet(() -> createUserFromGoogle(googleUser));

        if (!user.isActive()) {
            throw new ApiException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        return buildAuthResponse(user);
    }

    private User createUserFromGoogle(GoogleUserInfo googleUser) {
        Role userRole = roleRepository.findByRoleName(RoleName.USER)
                .orElseThrow(() -> new ApiException("Default USER role not configured", HttpStatus.INTERNAL_SERVER_ERROR));

        User user = User.builder()
                .name(googleUser.getName())
                .email(googleUser.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .active(true)
                .emailVerified(true)
                .roles(new HashSet<>(Collections.singletonList(userRole)))
                .build();

        return userRepository.save(user);
    }

    private ApiResponse<AuthResponse> buildAuthResponse(User user) {
        Map<String, Object> claims = new HashMap<>();
        Set<String> roles = user.getRoles()
                .stream()
                .map(r -> r.getRoleName().name())
                .collect(Collectors.toSet());
        claims.put("roles", roles);

        String accessToken = jwtService.generateAccessToken(user.getEmail(), claims);
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .revoked(false)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .roles(roles)
                .build();

        return ApiResponse.ok("Authentication successful", authResponse);
    }

    private String generateOtp() {
        String otp;
        SecureRandom random = new SecureRandom();
        do {
            otp = String.format("%06d", random.nextInt(1000000));
        } while (emailVerificationTokenRepository.existsByToken(otp));
        return otp;
    }
}

