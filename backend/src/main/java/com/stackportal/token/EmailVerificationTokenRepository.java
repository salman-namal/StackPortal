package com.stackportal.token;

import com.stackportal.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    boolean existsByToken(String token);
    void deleteByUser(User user);
}


