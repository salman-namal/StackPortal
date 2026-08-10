package com.stackportal.tenant.controller;

import com.stackportal.common.ApiResponse;
import com.stackportal.tenant.dto.TenantRequest;
import com.stackportal.tenant.dto.TenantResponse;
import com.stackportal.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for tenant (company / workspace) management.
 *
 * <p>All operations are restricted to users with the {@code SUPER_ADMIN} role.
 * Tenant admins manage their own workspace settings through separate APIs.
 */
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<ApiResponse<TenantResponse>> create(
            @Valid @RequestBody TenantRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tenant created successfully", tenantService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantResponse>>> getAll() {

        return ResponseEntity.ok(
                ApiResponse.ok("Tenants retrieved successfully", tenantService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantResponse>> getById(@PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.ok("Tenant retrieved successfully", tenantService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TenantRequest request) {

        return ResponseEntity.ok(
                ApiResponse.ok("Tenant updated successfully", tenantService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {

        tenantService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Tenant deleted successfully", null));
    }
}