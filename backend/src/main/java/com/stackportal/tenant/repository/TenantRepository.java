package com.stackportal.tenant.repository;

import com.stackportal.tenant.entity.Tenant;
import com.stackportal.tenant.entity.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    List<Tenant> findByStatus(TenantStatus status);
}