package com.stackportal.tenant.dto;

import com.stackportal.tenant.entity.TenantStatus;

import java.time.LocalDateTime;

/**
 * Response payload returned from tenant endpoints.
 *
 * <p>{@code databaseUrl} and {@code databaseUsername} are intentionally
 * excluded to avoid leaking connection details to API consumers.</p>
 */
public record TenantResponse(

        Long id,
        String name,
        String code,
        String logo,
        String email,
        String website,
        String phone,
        String address,
        String city,
        String country,
        String databaseName,
        TenantStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}