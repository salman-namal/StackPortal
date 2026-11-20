package com.stackportal.service.platform;

import com.stackportal.common.exception.TenantProvisioningException;
import com.stackportal.tenant.datasource.TenantDataSourceManager;
import com.stackportal.tenant.provisioning.TenantDatabaseProvisioner;
import com.stackportal.tenant.provisioning.TenantInitialAdminProvisioner;
import com.stackportal.tenant.migration.TenantMigrationRunner;
import com.stackportal.dto.request.tenant.TenantRequest;
import com.stackportal.dto.response.tenant.TenantResponse;
import com.stackportal.entity.master.Tenant;
import com.stackportal.entity.master.TenantStatus;
import com.stackportal.repository.master.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Locale;
import java.security.SecureRandom;
import com.stackportal.dto.response.tenant.TenantDashboardResponse;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "masterTransactionManager")
public class TenantService {
    private static final SecureRandom CODE_RANDOM = new SecureRandom();

    private final TenantRepository            tenantRepository;
    private final TenantDataSourceManager     tenantDataSourceManager;
    private final TenantDatabaseProvisioner   tenantDatabaseProvisioner;
    private final TenantMigrationRunner       tenantMigrationRunner;
    private final TenantInitialAdminProvisioner tenantInitialAdminProvisioner;
    private final MediaService mediaService;
    private final com.stackportal.repository.master.TenantAuditEventRepository tenantAuditEventRepository;

    @Value("${app.datasource.master.username}")
    private String masterUsername;

    @Value("${app.datasource.master.password}")
    private String masterPassword;

    @Value("${app.platform.default-tenant-code:stack}")
    private String defaultTenantCode;

    // -----------------------------------------------------------------------
    // CRUD
    // -----------------------------------------------------------------------

    public TenantResponse create(TenantRequest request) {
        validateProfile(request);
        if (request.adminName() == null || request.adminName().isBlank()
                || request.adminEmail() == null || request.adminEmail().isBlank()) {
            throw new IllegalArgumentException("An initial tenant administrator name and email are required");
        }
        // --- Business-rule checks ---
        if (tenantRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Tenant name already exists: " + request.name());
        }
        String code = generateUniqueCode(request.name());

        // --- Auto-provision the physical database ---
        TenantDatabaseProvisioner.ProvisionResult provision =
                tenantDatabaseProvisioner.provisionDatabase(code);

        // Use master credentials unless the caller supplied a dedicated password.
        String dbPassword = (request.databasePassword() != null
                && !request.databasePassword().isBlank())
                ? request.databasePassword()
                : masterPassword;

        // Flyway remains opt-in until production compatibility baselines are
        // approved. A new tenant must never be activated without its schema.
        tenantMigrationRunner.migrateNewTenant(
                provision.jdbcUrl(), masterUsername, dbPassword);

        tenantInitialAdminProvisioner.provision(provision.jdbcUrl(), masterUsername, dbPassword,
                request.adminName().trim(), request.adminEmail().trim().toLowerCase());

        // --- Persist the tenant record ---
        Tenant tenant = Tenant.builder()
                .name(request.name())
                .code(code)
                .logoId(validLogoId(request.logoId()))
                .adminName(trimToNull(request.adminName()))
                .email(normalizeEmail(request.adminEmail()))
                .website(request.website())
                .phone(request.phone())
                .address(request.address())
                .city(request.city())
                .country(request.country())
                .notes(trimToNull(request.notes()))
                .databaseName(provision.databaseName())
                .databaseUrl(provision.jdbcUrl())
                .databaseUsername(masterUsername)
                .databasePassword(dbPassword)
                .status(TenantStatus.ACTIVE)
                .build();

        Tenant saved;
        try {
            saved = tenantRepository.save(tenant);
        } catch (Exception ex) {
            // DB was created but the master record save failed — clean it up.
            log.error("Master record save failed after provisioning '{}'; cleaning up",
                    provision.databaseName(), ex);
            throw new TenantProvisioningException(
                    "Failed to persist tenant record after database provisioning: " + ex.getMessage(), ex);
        }

        // --- Register the connection pool ---
        if (saved.getStatus() == TenantStatus.ACTIVE) {
            try {
                tenantDataSourceManager.registerTenant(saved);
                log.info("DataSource provisioned for new tenant '{}' (id={})",
                        saved.getName(), saved.getId());
            } catch (Exception ex) {
                log.warn("DataSource registration failed for tenant '{}' (id={}): {}",
                        saved.getName(), saved.getId(), ex.getMessage());
            }
        }

        audit(saved.getId(), "CREATED", "Tenant and initial ADMIN provisioned");
        return toResponse(saved);
    }

    @Transactional(readOnly = true, transactionManager = "masterTransactionManager")
    public List<TenantResponse> getAll() {
        return tenantRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true, transactionManager = "masterTransactionManager")
    public Page<TenantResponse> search(String search, TenantStatus status, Pageable pageable) {
        return tenantRepository.search(search == null ? "" : search.trim(), status, pageable)
                .map(this::toListResponse);
    }

    @Transactional(readOnly = true, transactionManager = "masterTransactionManager")
    public TenantDashboardResponse dashboard() {
        return new TenantDashboardResponse(tenantRepository.count(),
                tenantRepository.countByStatus(TenantStatus.ACTIVE),
                tenantRepository.countByStatus(TenantStatus.INACTIVE),
                tenantRepository.findTop5ByOrderByCreatedAtDesc().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true, transactionManager = "masterTransactionManager")
    public TenantResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public TenantResponse update(Long id, TenantRequest request) {
        Tenant tenant = findOrThrow(id);
        validateProfile(request);

        if (!tenant.getName().equals(request.name())
                && tenantRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Tenant name already exists: " + request.name());
        }

        // Update mutable profile fields only; database* fields are immutable once provisioned.
        tenant.setName(request.name());
        java.util.UUID oldLogoId = tenant.getLogoId();
        tenant.setLogoId(validLogoId(request.logoId()));
        tenant.setAdminName(trimToNull(request.adminName()));
        tenant.setEmail(normalizeEmail(request.adminEmail()));
        tenant.setWebsite(request.website());
        tenant.setPhone(request.phone());
        tenant.setAddress(request.address());
        tenant.setCity(request.city());
        tenant.setCountry(request.country());
        tenant.setNotes(trimToNull(request.notes()));

        // Only update the password when a new one is explicitly supplied.
        if (request.databasePassword() != null && !request.databasePassword().isBlank()) {
            tenant.setDatabasePassword(request.databasePassword());
        }

        Tenant saved = tenantRepository.save(tenant);
        if (oldLogoId != null && !oldLogoId.equals(saved.getLogoId())) mediaService.deleteIfUnreferenced(oldLogoId);
        audit(saved.getId(), "UPDATED", "Tenant profile updated");

        // Sync the datasource pool with the new state.
        tenantDataSourceManager.removeTenant(saved.getId());
        if (saved.getStatus() == TenantStatus.ACTIVE) {
            try {
                tenantDataSourceManager.registerTenant(saved);
                log.info("DataSource re-provisioned for tenant '{}' (id={})",
                        saved.getName(), saved.getId());
            } catch (Exception ex) {
                log.warn("DataSource re-provisioning failed for tenant '{}' (id={}): {}",
                        saved.getName(), saved.getId(), ex.getMessage());
            }
        }

        return toResponse(saved);
    }

    public void delete(Long id, String confirmationName) {
        Tenant tenant = findOrThrow(id);
        Long currentTenantId = com.stackportal.tenant.context.TenantContext.getTenantId();
        if (id.equals(currentTenantId) || tenant.getCode().equalsIgnoreCase(defaultTenantCode)) {
            throw new IllegalStateException("Protected tenants cannot be deleted");
        }
        if (confirmationName == null || !tenant.getName().equals(confirmationName.trim())) {
            throw new IllegalArgumentException("Type the exact tenant name to confirm permanent deletion");
        }
        // Persist INACTIVE first so no new tenant authentication or datasource can be created.
        tenant.setStatus(TenantStatus.INACTIVE);
        tenantRepository.save(tenant);
        tenantDataSourceManager.removeTenant(id);
        tenantDatabaseProvisioner.deleteTrustedDatabase(tenant.getDatabaseName(), tenant.getDatabaseUrl());
        tenantRepository.delete(tenant);
        audit(id, "DELETED", "Tenant database and master record permanently deleted");
        log.info("Tenant {} permanently deleted", id);
    }

    public TenantResponse setStatus(Long id, TenantStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Tenant status is required");
        }
        Tenant tenant = findOrThrow(id);
        tenant.setStatus(status);
        Tenant saved = tenantRepository.save(tenant);
        tenantDataSourceManager.removeTenant(id);
        if (status == TenantStatus.ACTIVE) tenantDataSourceManager.registerTenant(saved);
        audit(id, status == TenantStatus.ACTIVE ? "ACTIVATED" : "DEACTIVATED", "Tenant status changed");
        return toResponse(saved);
    }

    private void audit(Long tenantId, String action, String detail) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String actor = authentication == null ? null : authentication.getName();
        tenantAuditEventRepository.save(com.stackportal.entity.master.TenantAuditEvent.builder()
                .tenantId(tenantId).action(action).actorEmail(actor).detail(detail).build());
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Tenant findOrThrow(Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));
    }

    /** Generates a lowercase URL-safe identifier, adding a random suffix on collisions. */
    private String generateUniqueCode(String tenantName) {
        String base = tenantName == null ? "tenant" : tenantName.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) base = "tenant";
        base = base.substring(0, Math.min(42, base.length()));
        String candidate = base;
        for (int attempt = 0; attempt < 20; attempt++) {
            if (!tenantRepository.existsByCode(candidate)) return candidate;
            candidate = base.substring(0, Math.min(42, base.length())) + "-" + Long.toUnsignedString(CODE_RANDOM.nextLong(), 36).substring(0, 6);
        }
        throw new IllegalStateException("Unable to allocate a unique tenant code");
    }

    private TenantResponse toResponse(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getCode(),
                tenant.getLogo(),
                tenant.getLogoId(),
                tenant.getAdminName(),
                tenant.getEmail(),
                tenant.getEmail(),
                tenant.getWebsite(),
                tenant.getPhone(),
                tenant.getAddress(),
                tenant.getCity(),
                tenant.getCountry(),
                tenant.getNotes(),
                tenant.getDatabaseName(),
                tenant.getStatus(),
                tenant.getCreatedAt(),
                tenant.getUpdatedAt()
        );
    }

    /** List responses deliberately omit large data URLs; the detail endpoint returns the full saved logo. */
    private TenantResponse toListResponse(Tenant tenant) {
        TenantResponse response = toResponse(tenant);
        String logo = response.logo();
        if (logo != null && logo.startsWith("data:") && logo.length() > 100_000) {
            return new TenantResponse(response.id(), response.name(), response.code(), null, response.logoId(),
                    response.adminName(), response.adminEmail(), response.email(), response.website(), response.phone(),
                    response.address(), response.city(), response.country(), response.notes(), response.databaseName(),
                    response.status(), response.createdAt(), response.updatedAt());
        }
        return response;
    }

    private void validateProfile(TenantRequest request) {
        if (request.name() == null || request.name().trim().length() < 3 || request.name().trim().length() > 100) {
            throw new IllegalArgumentException("Tenant name must be between 3 and 100 characters");
        }
        if (request.adminName() == null || request.adminName().trim().length() < 3 || request.adminName().trim().length() > 100) {
            throw new IllegalArgumentException("Administrator name must be between 3 and 100 characters");
        }
        if (request.adminEmail() == null || request.adminEmail().isBlank()) {
            throw new IllegalArgumentException("Administrator email is required");
        }
        if (request.website() != null && !request.website().isBlank() && !request.website().trim().matches("https?://.+")) {
            throw new IllegalArgumentException("Website must be a valid HTTP or HTTPS URL");
        }
        if (request.logoId() != null && !mediaService.exists(request.logoId())) throw new IllegalArgumentException("Selected logo was not found");
    }

    private java.util.UUID validLogoId(java.util.UUID id) { if (id != null && !mediaService.exists(id)) throw new IllegalArgumentException("Selected logo was not found"); return id; }

    private String trimToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String normalizeEmail(String value) { return value == null ? null : value.trim().toLowerCase(Locale.ROOT); }
}
