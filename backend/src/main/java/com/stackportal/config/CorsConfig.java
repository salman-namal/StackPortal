package com.stackportal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${app.cors.allowed-methods}")
    private List<String> allowedMethods;

    @Value("${app.cors.allowed-headers}")
    private List<String> allowedHeaders;

    @Value("${app.cors.allow-credentials}")
    private boolean allowCredentials;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(allowedMethods);

        // Ensure tenant headers are allowed
        java.util.List<String> headers = new java.util.ArrayList<>(allowedHeaders != null ? allowedHeaders : java.util.List.of());
        if (!headers.stream().map(String::toLowerCase).toList().contains("x-tenant-id")) {
            headers.add("X-Tenant-ID");
        }
        if (!headers.stream().map(String::toLowerCase).toList().contains("x-tenant-code")) {
            headers.add("X-Tenant-Code");
        }
        config.setAllowedHeaders(headers);

        config.setAllowCredentials(allowCredentials);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
