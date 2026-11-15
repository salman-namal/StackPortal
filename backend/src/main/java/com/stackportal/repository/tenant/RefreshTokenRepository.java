package com.stackportal.repository.tenant;

import com.stackportal.entity.tenant.RefreshToken;
import com.stackportal.entity.tenant.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
}

