package com.stackportal.service.platform;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Produces tenant portal URLs from immutable tenant codes; no URL is persisted. */
@Service
public class TenantLoginUrlService {
    @Value("${app.tenant-login-url-template:http://{tenant}.localhost:4200/auth/login}") private String template;
    public String loginUrl(String tenantCode) {
        if (tenantCode == null || !tenantCode.matches("[a-z0-9-]{1,50}")) throw new IllegalArgumentException("Invalid tenant code");
        return template.replace("{tenant}", tenantCode);
    }
    public String invitationUrl(String tenantCode, String token) { return loginUrl(tenantCode).replace("/auth/login", "/auth/accept-invitation") + "?token=" + token; }
}
