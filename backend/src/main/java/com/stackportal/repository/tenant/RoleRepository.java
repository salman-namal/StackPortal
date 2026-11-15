package com.stackportal.repository.tenant;

import com.stackportal.entity.tenant.Role;
import com.stackportal.entity.tenant.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(RoleName roleName);
}

