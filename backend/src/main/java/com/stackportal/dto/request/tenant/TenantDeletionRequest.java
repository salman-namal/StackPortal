package com.stackportal.dto.request.tenant;

import jakarta.validation.constraints.NotBlank;

public record TenantDeletionRequest(@NotBlank String tenantName) {
}
