package com.stackportal.repository.master;

import com.stackportal.entity.master.TenantAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantAuditEventRepository extends JpaRepository<TenantAuditEvent, Long> {
}
