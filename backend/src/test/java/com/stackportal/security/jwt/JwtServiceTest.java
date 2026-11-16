package com.stackportal.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService service(long expirationMinutes) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", "c3RhY2stcG9ydGFsLXRlc3Qta2V5LW11c3QtYmUtYXQtbGVhc3QtMzItYnl0ZXMtbG9uZw==");
        ReflectionTestUtils.setField(service, "accessTokenExpirationMinutes", expirationMinutes);
        ReflectionTestUtils.setField(service, "refreshTokenExpirationDays", 7L);
        return service;
    }

    @Test
    void retainsTenantClaimAndValidatesTheIssuedSubject() {
        JwtService service = service(15);
        String token = service.generateAccessToken("admin@tenant-a.test", Map.of("tenantId", 11L));

        assertThat(service.getTenantIdFromToken(token)).isEqualTo(11L);
        assertThat(service.isTokenValid(token, "admin@tenant-a.test")).isTrue();
        assertThat(service.isTokenValid(token, "admin@tenant-b.test")).isFalse();
    }

    @Test
    void marksAnAlreadyExpiredAccessTokenAsExpired() {
        JwtService service = service(-1);
        String token = service.generateAccessToken("user@tenant-a.test", Map.of("tenantId", 11L));

        assertThat(service.isTokenExpired(token)).isTrue();
    }
}
