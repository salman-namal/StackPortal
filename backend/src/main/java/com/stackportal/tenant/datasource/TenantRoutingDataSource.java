package com.stackportal.tenant.datasource;

import com.stackportal.tenant.context.TenantContext;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Routes JDBC connections to the correct tenant DataSource based on the
 * current {@link TenantContext}. Falls back to the master DataSource when no
 * tenant context is set (e.g. shared-infra requests such as auth or tenant
 * management).
 */
public class TenantRoutingDataSource extends AbstractRoutingDataSource {

    private final Map<Object, Object> tenantDataSources = new ConcurrentHashMap<>();

    /**
     * No-arg constructor — used by {@code DynamicDataSourceConfig}.
     * The default datasource must be set separately via
     * {@link #setDefaultTargetDataSource(Object)} before use.
     */
    public TenantRoutingDataSource() {
        // Default target datasource will be wired in via DynamicDataSourceConfig.
    }

    /**
     * Constructor that immediately sets the fallback (master) datasource and
     * initialises the empty routing map.
     */
    public TenantRoutingDataSource(DataSource masterDataSource) {
        setDefaultTargetDataSource(masterDataSource);
        setTargetDataSources(new HashMap<>(tenantDataSources));
        afterPropertiesSet();
    }

    @Override
    protected Object determineCurrentLookupKey() {
        if (!TenantContext.hasTenant()) {
            return null;
        }
        return TenantContext.requireTenantId();
    }

    /**
     * Registers a new tenant DataSource and refreshes the routing map.
     */
    public synchronized void addDataSource(Long tenantId, DataSource dataSource) {
        tenantDataSources.put(tenantId, dataSource);
        setTargetDataSources(new HashMap<>(tenantDataSources));
        afterPropertiesSet();
    }

    /**
     * Removes a tenant DataSource from the routing map.
     */
    public synchronized void removeDataSource(Long tenantId) {
        tenantDataSources.remove(tenantId);
        setTargetDataSources(new HashMap<>(tenantDataSources));
        afterPropertiesSet();
    }

    /**
     * Returns true if a DataSource is already registered for the given tenant.
     */
    public boolean hasDataSource(Long tenantId) {
        return tenantDataSources.containsKey(tenantId);
    }
}