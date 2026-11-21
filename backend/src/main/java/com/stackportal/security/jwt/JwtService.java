package com.stackportal.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration-minutes}")
    private long accessTokenExpirationMinutes;

    @Value("${jwt.refresh-token-expiration-days}")
    private long refreshTokenExpirationDays;

    public String generateAccessToken(String username, Map<String, Object> extraClaims) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenExpirationMinutes, ChronoUnit.MINUTES);
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String username) {
        return generateRefreshToken(username, Map.of());
    }

    public String generateRefreshToken(String username, Map<String, ?> extraClaims) {
        Instant now = Instant.now();
        Instant expiry = now.plus(refreshTokenExpirationDays, ChronoUnit.DAYS);
        return Jwts.builder()
                .setClaims(extraClaims == null ? Map.of() : extraClaims)
                .setSubject(username)
                // Refresh tokens are persisted under a unique constraint. Issued-at
                // timestamps have second precision in JWTs, so they are not enough
                // to distinguish two legitimate logins in the same second.
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long getTenantIdFromToken(String token) {
        Object tenantIdClaim = extractClaim(token, claims -> claims.get("tenantId"));
        if (tenantIdClaim instanceof Number number) {
            return number.longValue();
        }
        if (tenantIdClaim instanceof String tenantIdValue && !tenantIdValue.isBlank()) {
            return Long.valueOf(tenantIdValue);
        }
        return null;
    }

    /**
     * Returns the authentication scope carried by a token.  Platform tokens
     * deliberately have no tenant id, while tenant tokens have a tenant id.
     */
    public String getScopeFromToken(String token) {
        Object scope = extractClaim(token, claims -> claims.get("scope"));
        return scope == null ? null : scope.toString();
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean isTokenValid(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return extractedUsername.equals(username) && !isTokenExpired(token);
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException ex) {
            // Existing local installations may use a raw, high-entropy value
            // rather than a Base64-encoded value. Keep that configuration
            // compatible without logging the secret itself.
            keyBytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            log.warn("JWT secret is not Base64 encoded; using its raw UTF-8 bytes");
        }
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must contain at least 256 bits of key material");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

