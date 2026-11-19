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
import com.stackportal.dto.response.tenant.TenantDashboardResponse;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "masterTransactionManager")
public class TenantService {

    private final TenantRepository            tenantRepository;
    private final TenantDataSourceManager     tenantDataSourceManager;
    private final TenantDatabaseProvisioner   tenantDatabaseProvisioner;
    private final TenantMigrationRunner       tenantMigrationRunner;
    private final TenantInitialAdminProvisioner tenantInitialAdminProvisioner;
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
        if (request.adminName() == null || request.adminName().isBlank()
                || request.adminEmail() == null || request.adminEmail().isBlank()) {
            throw new IllegalArgumentException("An initial tenant administrator name and email are required");
        }
        // --- Business-rule checks ---
        if (tenantRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Tenant code already exists: " + request.code());
        }
        if (tenantRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Tenant name already exists: " + request.name());
        }

        // --- Auto-provision the physical database ---
        TenantDatabaseProvisioner.ProvisionResult provision =
                tenantDatabaseProvisioner.provisionDatabase(request.code());

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
                .code(request.code().toLowerCase().trim())
                .logo(request.logo())
                .email(request.email())
                .website(request.website())
                .phone(request.phone())
                .address(request.address())
                .city(request.city())
                .country(request.country())
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
                .map(this::toResponse);
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

        if (request.code() != null && !tenant.getCode().equalsIgnoreCase(request.code().trim())) {
            throw new IllegalArgumentException("Tenant code cannot be changed because it identifies the tenant database and routing");
        }
        if (!tenant.getName().equals(request.name())
                && tenantRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Tenant name already exists: " + request.name());
        }

        // Update mutable profile fields only; database* fields are immutable once provisioned.
        tenant.setName(request.name());
        tenant.setLogo(request.logo());
        tenant.setEmail(request.email());
        tenant.setWebsite(request.website());
        tenant.setPhone(request.phone());
        tenant.setAddress(request.address());
        tenant.setCity(request.city());
        tenant.setCountry(request.country());

        // Only update the password when a new one is explicitly supplied.
        if (request.databasePassword() != null && !request.databasePassword().isBlank()) {
            tenant.setDatabasePassword(request.databasePassword());
        }

        Tenant saved = tenantRepository.save(tenant);
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

    private TenantResponse toResponse(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getCode(),
                tenant.getLogo(),
                tenant.getEmail(),
                tenant.getWebsite(),
                tenant.getPhone(),
                tenant.getAddress(),
                tenant.getCity(),
                tenant.getCountry(),
                tenant.getDatabaseName(),
                tenant.getStatus(),
                tenant.getCreatedAt(),
                tenant.getUpdatedAt()
        );
    }
}
