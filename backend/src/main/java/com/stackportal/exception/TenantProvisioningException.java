package com.stackportal.exception;

/**
 * Thrown when the automatic provisioning of a tenant PostgreSQL database fails.
 * Results in a 503 Service Unavailable response to the caller.
 */
public class TenantProvisioningException extends RuntimeException {

    public TenantProvisioningException(String message) {
        super(message);
    }

    public TenantProvisioningException(String message, Throwable cause) {
        super(message, cause);
    }
}
