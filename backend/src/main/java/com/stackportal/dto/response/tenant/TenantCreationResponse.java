package com.stackportal.dto.response.tenant;
/** Temporary password is returned only by create/reset responses and is never persisted in master data. */
public record TenantCreationResponse(TenantResponse tenant, String administratorEmail, String temporaryPassword) { }
