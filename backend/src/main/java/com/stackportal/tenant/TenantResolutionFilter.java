package com.stackportal.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stackportal.common.ApiResponse;
import com.stackportal.tenant.context.TenantContext;
import com.stackportal.tenant.datasource.TenantDataSourceManager;
import com.stackportal.tenant.entity.Tenant;
import com.stackportal.tenant.entity.TenantStatus;
import com.stackportal.tenant.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;

/**
 * Resolves the tenant from the request hostname and, when available, stores the
 * tenant id in {@link TenantContext}. Local development can optionally fall back
 * to the {@code X-Tenant-Code} header when the host is a localhost variant.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TenantResolutionFilter extends OncePerRequestFilter {

    public static final String TENANT_HEADER = "X-Tenant-Code";

    private final TenantRepository tenantRepository;
    private final TenantDataSourceManager tenantDataSourceManager;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith(request.getContextPath() + "/api/tenants");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String tenantCode = resolveTenantCode(request);

        try {
            if (isTenantResolutionRequired(request)) {
                if (tenantCode == null || tenantCode.isBlank()) {
                    writeError(response, HttpStatus.BAD_REQUEST, "Missing tenant");
                    return;
                }

                Tenant tenant = tenantRepository.findByCode(tenantCode.toLowerCase(Locale.ROOT))
                        .orElse(null);
                if (tenant == null) {
                    writeError(response, HttpStatus.NOT_FOUND, "Tenant '" + tenantCode + "' does not exist.");
                    return;
                }
                if (tenant.getStatus() != TenantStatus.ACTIVE) {
                    writeError(response, HttpStatus.FORBIDDEN, "Tenant '" + tenantCode + "' is not active.");
                    return;
                }
                if (!tenantDataSourceManager.isRegistered(tenant.getId())) {
                    writeError(response, HttpStatus.SERVICE_UNAVAILABLE, "Tenant database is not ready yet.");
                    return;
                }

                TenantContext.setTenantId(tenant.getId());
                log.debug("Resolved tenant '{}' to id={} for {} {}", tenantCode, tenant.getId(), request.getMethod(), request.getRequestURI());
            } else if (tenantCode != null && !tenantCode.isBlank()) {
                Tenant tenant = tenantRepository.findByCode(tenantCode.toLowerCase(Locale.ROOT))
                        .orElse(null);
                if (tenant != null && tenant.getStatus() == TenantStatus.ACTIVE) {
                    TenantContext.setTenantId(tenant.getId());
                    log.debug("Resolved tenant '{}' to id={} for {} {}", tenantCode, tenant.getId(), request.getMethod(), request.getRequestURI());
                } else {
                    log.debug("No active tenant context resolved for code '{}'", tenantCode);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean isTenantResolutionRequired(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith(request.getContextPath() + "/api/auth/");
    }

    private String resolveTenantCode(HttpServletRequest request) {
        String host = extractHost(request);
        if (host == null || host.isBlank()) {
            return null;
        }

        String tenantCodeFromHost = extractTenantCodeFromHost(host);
        if (tenantCodeFromHost != null && !tenantCodeFromHost.isBlank()) {
            return tenantCodeFromHost;
        }

        if (isLocalDevelopmentHost(host)) {
            String headerValue = request.getHeader(TENANT_HEADER);
            if (headerValue != null && !headerValue.isBlank()) {
                return headerValue.trim();
            }
        }

        return null;
    }

    private String extractHost(HttpServletRequest request) {
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        if (forwardedHost != null && !forwardedHost.isBlank()) {
            return forwardedHost.split(",")[0].trim();
        }

        String hostHeader = request.getHeader("Host");
        if (hostHeader != null && !hostHeader.isBlank()) {
            return hostHeader;
        }

        return request.getServerName();
    }

    private String extractTenantCodeFromHost(String host) {
        String normalizedHost = host.toLowerCase(Locale.ROOT).replaceFirst("^https?://", "");
        if (normalizedHost.contains(":")) {
            normalizedHost = normalizedHost.substring(0, normalizedHost.indexOf(':'));
        }
        if (normalizedHost.endsWith(".")) {
            normalizedHost = normalizedHost.substring(0, normalizedHost.length() - 1);
        }
        if (normalizedHost.startsWith("www.")) {
            normalizedHost = normalizedHost.substring(4);
        }
        if (normalizedHost.equals("localhost") || normalizedHost.equals("127.0.0.1") || normalizedHost.equals("0.0.0.0")) {
            return null;
        }

        String[] labels = normalizedHost.split("\\.");
        if (labels.length < 2) {
            return null;
        }
        String tenantCode = labels[0];
        return tenantCode.equals("www") || tenantCode.isBlank() ? null : tenantCode;
    }

    private boolean isLocalDevelopmentHost(String host) {
        String normalizedHost = host.toLowerCase(Locale.ROOT);
        return normalizedHost.equals("localhost")
                || normalizedHost.endsWith(".localhost")
                || normalizedHost.equals("127.0.0.1")
                || normalizedHost.equals("0.0.0.0");
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.fail(message)));
    }
}
