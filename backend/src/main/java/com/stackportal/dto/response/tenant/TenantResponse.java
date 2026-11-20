package com.stackportal.dto.response.tenant;

import com.stackportal.entity.master.TenantStatus;

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
        String adminName,
        String adminEmail,
        String email,
        String website,
        String phone,
        String address,
        String city,
        String country,
        String notes,
        String databaseName,
        TenantStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
