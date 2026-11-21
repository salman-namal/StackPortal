package com.stackportal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    /** Allows local tenant hosts such as acme.localhost:4200 without opening arbitrary origins. */
    @Value("${app.cors.allowed-origin-patterns:http://localhost:4200,http://*.localhost:4200}")
    private List<String> allowedOriginPatterns;

    @Value("${app.cors.allowed-methods}")
    private List<String> allowedMethods;

    @Value("${app.cors.allowed-headers}")
    private List<String> allowedHeaders;

    @Value("${app.cors.allow-credentials}")
    private boolean allowCredentials;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Use origin patterns exclusively.  This retains explicitly configured origins
        // while supporting the controlled tenant subdomain pattern in local/prod.
        LinkedHashSet<String> originPatterns = new LinkedHashSet<>();
        if (allowedOrigins != null) {
            originPatterns.addAll(allowedOrigins);
        }
        if (allowedOriginPatterns != null) {
            originPatterns.addAll(allowedOriginPatterns);
        }
        config.setAllowedOriginPatterns(new ArrayList<>(originPatterns));

        List<String> methods = new ArrayList<>(allowedMethods != null ? allowedMethods : List.of());
        if (methods.stream().noneMatch(HttpMethod.OPTIONS::matches)) {
            methods.add(HttpMethod.OPTIONS.name());
        }
        config.setAllowedMethods(methods);

        // Ensure tenant headers are allowed
        java.util.List<String> headers = new java.util.ArrayList<>(allowedHeaders != null ? allowedHeaders : java.util.List.of());
        if (!headers.stream().map(String::toLowerCase).toList().contains("x-tenant-id")) {
            headers.add("X-Tenant-ID");
        }
        if (!headers.stream().map(String::toLowerCase).toList().contains("x-tenant-code")) {
            headers.add("X-Tenant-Code");
        }
        if (!headers.stream().map(String::toLowerCase).toList().contains("authorization")) {
            headers.add("Authorization");
        }
        if (!headers.stream().map(String::toLowerCase).toList().contains("content-type")) {
            headers.add("Content-Type");
        }
        config.setAllowedHeaders(headers);

        config.setAllowCredentials(allowCredentials);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
