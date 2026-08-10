package com.stackportal.init;

import com.stackportal.tenant.dto.TenantRequest;
import com.stackportal.tenant.dto.TenantResponse;
import com.stackportal.tenant.service.TenantService;
import com.stackportal.tenant.context.TenantContext;
import com.stackportal.tenant.entity.Tenant;
import com.stackportal.tenant.repository.TenantRepository;
import com.stackportal.tenant.datasource.TenantDataSourceManager;
import com.stackportal.user.Role;
import com.stackportal.user.RoleName;
import com.stackportal.user.RoleRepository;
import com.stackportal.user.User;
import com.stackportal.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import java.util.Set;

/**
 * Initializes default tenant and super-admin user on application startup.
 * Runs idempotently so it can be executed multiple times safely.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final TenantRepository tenantRepository;
    private final TenantDataSourceManager tenantDataSourceManager;
    private final TenantService tenantService;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Qualifier("masterDataSource")
    private final DataSource masterDataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        try {
            TenantResponse tenantResp;
            if (!tenantRepository.existsByCode("stack")) {
                TenantRequest req = new TenantRequest(
                        "Stack",
                        "stack",
                        null,
                        "admin@stack.com",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );
                tenantResp = tenantService.create(req);
                log.info("Created tenant '{}' (id={}) via TenantService", tenantResp.name(), tenantResp.id());
            } else {
                Tenant t = tenantRepository.findByCode("stack").orElseThrow();
                tenantResp = new TenantResponse(
                        t.getId(), t.getName(), t.getCode(), t.getLogo(), t.getEmail(), t.getWebsite(),
                        t.getPhone(), t.getAddress(), t.getCity(), t.getCountry(), t.getDatabaseName(), t.getStatus(),
                        t.getCreatedAt(), t.getUpdatedAt()
                );
                try {
                    tenantDataSourceManager.registerTenant(t);
                } catch (Exception ex) {
                    log.warn("Tenant datasource registration failed: {}", ex.getMessage());
                }
            }

            ensureTenantSchemaExists(tenantResp.id());
            // Verify tenant users table has expected columns (provider/provider_id) before inserting users
            verifyUsersTableHasProvider(tenantResp.id());
            createSuperAdminUserForTenant(tenantResp.id());

        } catch (Exception ex) {
            log.error("Failed to initialize default tenant or user: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Ensures tenant DB schema exists by executing V1..V3 SQL scripts against the tenant DB.
     * Safe to call multiple times.
     */
    protected void ensureTenantSchemaExists(Long tenantId) {
        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            String url = tenant.getDatabaseUrl();
            String username = tenant.getDatabaseUsername();
            String password = tenant.getDatabasePassword();

            HikariDataSource ds = new HikariDataSource();
            ds.setJdbcUrl(url);
            ds.setUsername(username);
            ds.setPassword(password);
            ds.setDriverClassName("org.postgresql.Driver");
            ds.setMaximumPoolSize(1);
            ds.setMinimumIdle(0);
            try {
                Resource[] resources = new Resource[] {
                        new ClassPathResource("db/migration/V1__init.sql"),
                        new ClassPathResource("db/migration/V2__add_username_to_users.sql"),
                        new ClassPathResource("db/migration/V3__add_google_auth_provider.sql")
                };
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
                populator.setContinueOnError(false);
                for (Resource r : resources) populator.addScript(r);
                try {
                    populator.execute(ds);
                    log.info("Executed tenant DB scripts V1..V3 for tenant id={}", tenantId);

                    // Fallback: run explicit ALTER statements without DO $$ blocks in case the scripts used anonymous blocks
                    try (java.sql.Connection conn = ds.getConnection(); java.sql.Statement st = conn.createStatement()) {
                        String[] fallback = new String[] {
                                "ALTER TABLE users ALTER COLUMN password DROP NOT NULL",
                                "ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'LOCAL'",
                                "ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255)",
                                "UPDATE users SET provider = 'LOCAL' WHERE provider IS NULL",
                                "ALTER TABLE users ALTER COLUMN provider SET NOT NULL"
                        };
                        for (String sql : fallback) {
                            try {
                                st.execute(sql);
                            } catch (Exception inner) {
                                // log and continue with next fallback statement
                                log.debug("Fallback SQL failed (ignored): {} -> {}", sql, inner.getMessage());
                            }
                        }
                    } catch (Exception inner) {
                        log.warn("Failed to run fallback ALTERs for tenant id={}: {}", tenantId, inner.getMessage());
                    }

                } catch (Exception e) {
                    log.error("Error executing tenant DB scripts for tenant id={}: {}", tenantId, e.getMessage(), e);
                    throw e;
                }
            } catch (Exception ex) {
                log.warn("Failed to populate tenant schema for tenant id={}: {}", tenantId, ex.getMessage());
            } finally {
                try { ds.close(); } catch (Exception ignored) {}
            }
        });
    }

    /**
     * Verify users table contains provider column
     */
    protected void verifyUsersTableHasProvider(Long tenantId) {
        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            String url = tenant.getDatabaseUrl();
            String username = tenant.getDatabaseUsername();
            String password = tenant.getDatabasePassword();

            HikariDataSource ds = new HikariDataSource();
            ds.setJdbcUrl(url);
            ds.setUsername(username);
            ds.setPassword(password);
            ds.setDriverClassName("org.postgresql.Driver");
            ds.setMaximumPoolSize(1);
            ds.setMinimumIdle(0);
            try (java.sql.Connection conn = ds.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement(
                         "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='provider'")) {
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        log.error("'provider' column missing in tenant users table for tenant id={}.", tenantId);
                        throw new IllegalStateException("Tenant users table missing 'provider' column. Run V3 migration against the tenant DB or check provisioning.");
                    }
                }
            } catch (Exception e) {
                log.error("Error checking users table for tenant id={}: {}", tenantId, e.getMessage(), e);
                throw new RuntimeException(e);
            } finally {
                try { ds.close(); } catch (Exception ignored) {}
            }
        });
    }

    /**
     * Create super admin user in the tenant context. Idempotent.
     */
    @Transactional(transactionManager = "tenantTransactionManager")
    protected void createSuperAdminUserForTenant(Long tenantId) {
        String email = "superadmin@gmail.com";

        try {
            TenantContext.setTenantId(tenantId);

            if (userRepository.existsByEmail(email)) {
                log.info("Super admin user '{}' already exists in tenant id={}", email, tenantId);
                return;
            }

            // Ensure roles exist in tenant DB (seed if necessary)
            for (RoleName rn : RoleName.values()) {
                if (roleRepository.findByRoleName(rn).isEmpty()) {
                    Role r = new Role();
                    r.setRoleName(rn);
                    roleRepository.save(r);
                }
            }

            Role superRole = roleRepository.findByRoleName(RoleName.SUPER_ADMIN)
                    .orElseThrow(() -> new IllegalStateException("SUPER_ADMIN role not found after seeding"));

            User user = User.builder()
                    .name("Super Admin")
                    .email(email)
                    .username("superadmin")
                    .password(passwordEncoder.encode("admin123@"))
                    .active(true)
                    .emailVerified(true)
                    .roles(Set.of(superRole))
                    .build();

            User saved = userRepository.save(user);
            log.info("Created super admin user '{}' (id={}) in tenant id={}", saved.getEmail(), saved.getId(), tenantId);

        } finally {
            TenantContext.clear();
        }
    }
}
