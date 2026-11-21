package com.stackportal.controller.platform;

import com.stackportal.common.response.ApiResponse;
import com.stackportal.dto.request.tenant.TenantRequest;
import com.stackportal.dto.request.tenant.TenantDeletionRequest;
import com.stackportal.dto.response.tenant.TenantResponse;
import com.stackportal.dto.response.tenant.TenantCreationResponse;
import com.stackportal.dto.response.tenant.AdminPasswordResetResponse;
import com.stackportal.dto.response.tenant.TenantAdministratorAccessResponse;
import com.stackportal.dto.response.tenant.TenantDashboardResponse;
import com.stackportal.service.platform.TenantService;
import com.stackportal.service.platform.TenantLogoStorageService;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.stackportal.entity.master.TenantStatus;

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
    private final TenantLogoStorageService tenantLogoStorageService;

    @PostMapping(value = "/logo", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<String>> uploadLogo(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tenant logo uploaded", tenantLogoStorageService.store(file)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<TenantDashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.ok("Tenant dashboard retrieved", tenantService.dashboard()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TenantCreationResponse>> create(
            @Valid @RequestBody TenantRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tenant created successfully", tenantService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TenantResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TenantStatus status) {

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        String safeSort = List.of("name", "code", "status", "createdAt", "updatedAt").contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return ResponseEntity.ok(
                ApiResponse.ok("Tenants retrieved successfully", tenantService.search(search, status, PageRequest.of(safePage, safeSize, Sort.by(direction, safeSort)))));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TenantResponse>> setStatus(@PathVariable Long id,
                                                                  @RequestParam TenantStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Tenant status updated", tenantService.setStatus(id, status)));
    }

    @PostMapping("/{id}/admin-password/reset")
    public ResponseEntity<ApiResponse<AdminPasswordResetResponse>> resetAdministratorPassword(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Administrator password reset", tenantService.resetAdministratorPassword(id)));
    }

    @GetMapping("/{id}/administrator-access")
    public ResponseEntity<ApiResponse<TenantAdministratorAccessResponse>> administratorAccess(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Tenant administrator access retrieved", tenantService.administratorAccess(id)));
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
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id,
                                                    @Valid @RequestBody TenantDeletionRequest request) {

        tenantService.delete(id, request.tenantName());
        return ResponseEntity.ok(ApiResponse.ok("Tenant permanently deleted", null));
    }
}
