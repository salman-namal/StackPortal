package com.stackportal.dto.response.tenant;

/** Read-only identity details for the initial tenant administrator. */
public record TenantAdministratorAccessResponse(String administratorName, String administratorEmail,
                                                 String administratorUsername) { }
