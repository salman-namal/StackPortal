package com.stackportal.security;

import com.stackportal.tenant.context.TenantContext;
import com.stackportal.user.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserService userService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith(request.getContextPath() + "/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username = jwtService.extractUsername(jwt);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            Long tenantId = jwtService.getTenantIdFromToken(jwt);
            if (tenantId == null) {
                writeError(response, HttpStatus.UNAUTHORIZED, "Invalid JWT tenant claim");
                return;
            }

            String clientTenantHeader = request.getHeader("X-Tenant-ID");
            if (clientTenantHeader == null || clientTenantHeader.isBlank()) {
                clientTenantHeader = request.getHeader("x-tenant-id");
            }
            if (clientTenantHeader != null && !clientTenantHeader.isBlank() && !clientTenantHeader.trim().equals(String.valueOf(tenantId))) {
                writeError(response, HttpStatus.FORBIDDEN, "Tenant mismatch");
                return;
            }

            Long resolvedTenantId = TenantContext.getTenantId();
            if (resolvedTenantId != null && !resolvedTenantId.equals(tenantId)) {
                writeError(response, HttpStatus.FORBIDDEN, "Tenant mismatch");
                return;
            }

            TenantContext.setTenantId(tenantId);

            UserDetails userDetails = userService.loadUserByUsername(username);
            if (userDetails.isEnabled() && jwtService.isTokenValid(jwt, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"") + "\",\"data\":null}");
    }
}

