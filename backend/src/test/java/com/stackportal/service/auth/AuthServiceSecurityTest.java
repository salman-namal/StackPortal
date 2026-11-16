package com.stackportal.service.auth;

import com.stackportal.common.exception.ApiException;
import com.stackportal.entity.tenant.RefreshToken;
import com.stackportal.repository.tenant.EmailVerificationTokenRepository;
import com.stackportal.repository.tenant.PasswordResetTokenRepository;
import com.stackportal.repository.tenant.RefreshTokenRepository;
import com.stackportal.repository.tenant.RoleRepository;
import com.stackportal.repository.tenant.UserRepository;
import com.stackportal.security.jwt.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AuthServiceSecurityTest {

    @Test
    void rejectsARevokedRefreshTokenBeforeIssuingNewCredentials() {
        RefreshTokenRepository refreshTokens = mock(RefreshTokenRepository.class);
        RefreshToken token = RefreshToken.builder().token("synthetic-revoked-token")
                .revoked(true).expiresAt(Instant.now().plusSeconds(300)).build();
        when(refreshTokens.findByToken("synthetic-revoked-token")).thenReturn(Optional.of(token));

        AuthService service = new AuthService(
                mock(UserRepository.class), mock(RoleRepository.class),
                mock(EmailVerificationTokenRepository.class), mock(PasswordResetTokenRepository.class),
                refreshTokens, mock(PasswordEncoder.class), mock(JwtService.class),
                mock(AuthenticationManager.class), mock(EmailService.class), mock(GoogleOAuth2Service.class));

        assertThatThrownBy(() -> service.refreshToken("synthetic-revoked-token"))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> org.assertj.core.api.Assertions.assertThat(exception.getStatus())
                                .isEqualTo(HttpStatus.UNAUTHORIZED));
        verify(refreshTokens).findByToken("synthetic-revoked-token");
        verifyNoMoreInteractions(refreshTokens);
    }
}
