package com.stackportal.repository.tenant;

import com.stackportal.entity.tenant.PasswordResetToken;
import com.stackportal.entity.tenant.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUser(User user);
}

