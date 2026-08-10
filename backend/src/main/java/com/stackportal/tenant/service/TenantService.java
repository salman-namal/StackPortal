package com.stackportal.tenant.service;

import com.stackportal.exception.TenantProvisioningException;
import com.stackportal.tenant.datasource.TenantDataSourceManager;
import com.stackportal.tenant.dto.TenantRequest;
import com.stackportal.tenant.dto.TenantResponse;
import com.stackportal.tenant.entity.Tenant;
import com.stackportal.tenant.entity.TenantStatus;
import com.stackportal.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "masterTransactionManager")
public class TenantService {

    private final TenantRepository            tenantRepository;
    private final TenantDataSourceManager     tenantDataSourceManager;
    private final TenantDatabaseProvisioner   tenantDatabaseProvisioner;

    @Value("${app.datasource.master.username}")
    private String masterUsername;

    @Value("${app.datasource.master.password}")
    private String masterPassword;

    // -----------------------------------------------------------------------
    // CRUD
    // -----------------------------------------------------------------------

    public TenantResponse create(TenantRequest request) {
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
                .status(request.status() != null ? request.status() : TenantStatus.ACTIVE)
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
    public TenantResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public TenantResponse update(Long id, TenantRequest request) {
        Tenant tenant = findOrThrow(id);

        if (!tenant.getCode().equals(request.code())
                && tenantRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Tenant code already exists: " + request.code());
        }
        if (!tenant.getName().equals(request.name())
                && tenantRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Tenant name already exists: " + request.name());
        }

        // Update mutable profile fields only; database* fields are immutable once provisioned.
        tenant.setName(request.name());
        tenant.setCode(request.code().toLowerCase().trim());
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

        if (request.status() != null) {
            tenant.setStatus(request.status());
        }

        Tenant saved = tenantRepository.save(tenant);

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

    public void delete(Long id) {
        if (!tenantRepository.existsById(id)) {
            throw new IllegalArgumentException("Tenant not found: " + id);
        }
        tenantRepository.deleteById(id);
        tenantDataSourceManager.removeTenant(id);
        log.info("Tenant {} deleted and datasource pool closed", id);
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