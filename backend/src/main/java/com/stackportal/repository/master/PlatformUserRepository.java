package com.stackportal.repository.master;

import com.stackportal.entity.master.PlatformUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlatformUserRepository extends JpaRepository<PlatformUser, Long> {
    Optional<PlatformUser> findByEmailIgnoreCaseOrUsernameIgnoreCase(String email, String username);
}

