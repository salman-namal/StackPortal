package com.stackportal.tenant.datasource;

import com.stackportal.tenant.entity.Tenant;
import com.stackportal.tenant.entity.TenantStatus;
import com.stackportal.tenant.repository.TenantRepository;
import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages per-tenant HikariCP connection pools.
 *
 * <p>On application startup all ACTIVE tenants are loaded from the master
 * database and their DataSources are registered into
 * {@link TenantRoutingDataSource}. Subsequent create/update/delete operations
 * in {@link com.stackportal.tenant.service.TenantService} call the
 * {@code registerTenant} / {@code removeTenant} helpers to keep the routing
 * map in sync without a restart.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantDataSourceManager {

    private final TenantRepository tenantRepository;
    private final TenantRoutingDataSource tenantRoutingDataSource;

    /** Live pool cache — key = tenant id. */
    private final Map<Long, DataSource> dataSources = new ConcurrentHashMap<>();

    // -----------------------------------------------------------------------
    // Startup
    // -----------------------------------------------------------------------

    /**
     * Loads all ACTIVE tenants from the master DB and provisions their
     * connection pools. Called once after the application context is fully
     * refreshed.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void loadActiveTenants() {
        log.info("Provisioning datasources for active tenants…");
        tenantRepository.findByStatus(TenantStatus.ACTIVE).forEach(tenant -> {
            try {
                registerTenant(tenant);
                log.info("  ✓ Tenant '{}' (id={}) datasource ready", tenant.getName(), tenant.getId());
            } catch (Exception e) {
                log.warn("  ✗ Failed to provision datasource for tenant '{}' (id={}): {}",
                        tenant.getName(), tenant.getId(), e.getMessage());
            }
        });
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Creates a new HikariCP pool for {@code tenant} and registers it in the
     * routing datasource. Closes any previously open pool for the same id.
     */
    public void registerTenant(Tenant tenant) {
        // Close the existing pool for this tenant (e.g. credentials changed).
        DataSource existing = dataSources.get(tenant.getId());
        if (existing instanceof HikariDataSource hikari && !hikari.isClosed()) {
            hikari.close();
        }
        DataSource ds = createDataSource(tenant);
        dataSources.put(tenant.getId(), ds);
        tenantRoutingDataSource.addDataSource(tenant.getId(), ds);
    }

    /**
     * Closes the pool for {@code tenantId} and removes it from the routing
     * map. Safe to call even if the tenant was never registered.
     */
    public void removeTenant(Long tenantId) {
        DataSource ds = dataSources.remove(tenantId);
        if (ds instanceof HikariDataSource hikari && !hikari.isClosed()) {
            hikari.close();
        }
        tenantRoutingDataSource.removeDataSource(tenantId);
    }

    /**
     * Returns {@code true} when a live pool is already registered for the
     * given tenant id.
     */
    public boolean isRegistered(Long tenantId) {
        return dataSources.containsKey(tenantId);
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    private DataSource createDataSource(Tenant tenant) {
        if (tenant.getStatus() != TenantStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Cannot provision datasource for inactive tenant: " + tenant.getId());
        }

        HikariDataSource ds = new HikariDataSource();
        ds.setPoolName("tenant-pool-" + tenant.getId());
        ds.setJdbcUrl(tenant.getDatabaseUrl());
        ds.setUsername(tenant.getDatabaseUsername());
        ds.setPassword(tenant.getDatabasePassword());
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setMaximumPoolSize(10);
        ds.setMinimumIdle(2);
        ds.setIdleTimeout(600_000L);
        ds.setConnectionTimeout(30_000L);
        ds.setMaxLifetime(1_800_000L);
        return ds;
    }
}
