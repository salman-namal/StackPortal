package com.stackportal.dto.response.tenant;

/** A password is returned only at reset time and is never persisted in this response. */
public record AdminPasswordResetResponse(String administratorName, String administratorEmail,
                                         String administratorUsername, String temporaryPassword) { }
