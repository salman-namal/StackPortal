package com.stackportal.tenant.service;

import com.stackportal.exception.TenantProvisioningException;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Responsible for physically creating a new PostgreSQL database for a tenant,
 * initialising its schema, and verifying the connection before returning.
 *
 * <p>All DDL against the master DB (CREATE DATABASE / DROP DATABASE) is executed
 * through the master {@link DataSource} using raw JDBC — these statements cannot
 * run inside a regular transaction and must go over an auto-commit connection.</p>
 */
@Slf4j
@Service
public class TenantDatabaseProvisioner {

    private static final int  MAX_DB_NAME_LENGTH = 63;

    private final DataSource masterDataSource;

    @Value("${app.datasource.master.username}")
    private String masterUsername;

    @Value("${app.datasource.master.password}")
    private String masterPassword;

    /** JDBC URL prefix extracted from the master URL, e.g. {@code jdbc:postgresql://host:5432/} */
    private volatile String jdbcPrefix;

    public TenantDatabaseProvisioner(
            @Qualifier("masterDataSource") DataSource masterDataSource) {
        this.masterDataSource = masterDataSource;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Provisions a new PostgreSQL database for the tenant identified by {@code tenantCode}.
     *
     * @param tenantCode the unique tenant code (e.g. "acme")
     * @return a {@link ProvisionResult} containing the generated db name and JDBC URL
     * @throws TenantProvisioningException if anything goes wrong
     */
    public ProvisionResult provisionDatabase(String tenantCode) {
        String dbName = generateDbName(tenantCode);
        log.info("Provisioning tenant database '{}'", dbName);

        boolean created = false;
        try {
            createDatabase(dbName);
            created = true;

            String jdbcUrl = buildJdbcUrl(dbName);
            initSchema(jdbcUrl);
            verifyConnection(jdbcUrl);

            log.info("Tenant database '{}' provisioned successfully", dbName);
            return new ProvisionResult(dbName, jdbcUrl);

        } catch (TenantProvisioningException ex) {
            if (created) {
                cleanupDatabase(dbName);
            }
            throw ex;
        } catch (Exception ex) {
            if (created) {
                cleanupDatabase(dbName);
            }
            throw new TenantProvisioningException(
                    "Failed to provision tenant database '" + dbName + "': " + ex.getMessage(), ex);
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Generates a safe, unique PostgreSQL database name from the tenant code.
     * Format: {@code tenant_<sanitised_code>}, max 63 characters.
     */
    String generateDbName(String tenantCode) {
        // Keep only alphanumerics + underscores, lower-case
        String safe = tenantCode.toLowerCase()
                .replaceAll("[^a-z0-9_]", "_");

        String name = "tenant_" + safe;

        if (name.length() > MAX_DB_NAME_LENGTH) {
            name = name.substring(0, MAX_DB_NAME_LENGTH);
        }
        return name;
    }

    /** Creates the PostgreSQL database using an auto-commit master connection. */
    private void createDatabase(String dbName) {
        // Validate name one more time before injecting into DDL
        if (!dbName.matches("[a-z0-9_]{1,63}")) {
            throw new TenantProvisioningException("Unsafe database name generated: " + dbName);
        }

        // Check if the DB already exists at the PostgreSQL level
        try (Connection conn = masterDataSource.getConnection()) {
            conn.setAutoCommit(true);

            try (Statement stmt = conn.createStatement()) {
                // pg_database check
                ResultSet rs = stmt.executeQuery(
                        "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'");
                if (rs.next()) {
                    log.warn("Database '{}' already exists in PostgreSQL — reusing it", dbName);
                    return;
                }
            }

            // CREATE DATABASE cannot run inside a transaction block; autoCommit=true suffices.
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("CREATE DATABASE \"" + dbName + "\"");
                log.info("PostgreSQL database '{}' created", dbName);
            }
        } catch (TenantProvisioningException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new TenantProvisioningException(
                    "Could not create database '" + dbName + "': " + ex.getMessage(), ex);
        }
    }

    /**
     * Derives the JDBC URL for the new tenant DB from the master JDBC URL.
     * Replaces the last path segment (db name) with {@code dbName}.
     */
    String buildJdbcUrl(String dbName) {
        try (Connection conn = masterDataSource.getConnection()) {
            String masterUrl = conn.getMetaData().getURL();
            // masterUrl looks like: jdbc:postgresql://host:5432/masterdb
            int lastSlash = masterUrl.lastIndexOf('/');
            return masterUrl.substring(0, lastSlash + 1) + dbName;
        } catch (Exception ex) {
            throw new TenantProvisioningException(
                    "Could not determine JDBC URL for tenant DB: " + ex.getMessage(), ex);
        }
    }

    /**
     * Runs Hibernate {@code hbm2ddl} (update mode) against the new tenant
     * DataSource to create all tenant-scoped tables.
     */
    private void initSchema(String jdbcUrl) {
        log.info("Initialising schema in '{}'", jdbcUrl);
        try (HikariDataSource ds = buildTempDataSource(jdbcUrl)) {

            // Use a LocalContainerEntityManagerFactoryBean in "create" mode so
            // Hibernate generates the DDL for all tenant-mapped entities.
            org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean emfb =
                    new org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean();
            emfb.setDataSource(ds);
            emfb.setPackagesToScan("com.stackportal.user", "com.stackportal.token");
            emfb.setJpaVendorAdapter(new org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter());

            java.util.Map<String, Object> props = new java.util.HashMap<>();
            props.put("hibernate.hbm2ddl.auto", "update");
            props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
            emfb.setJpaPropertyMap(props);

            emfb.afterPropertiesSet();
            // afterPropertiesSet() triggers schema export; close the factory right away.
            emfb.getObject().close();

            log.info("Schema initialised in '{}'", jdbcUrl);
        } catch (Exception ex) {
            throw new TenantProvisioningException(
                    "Schema initialisation failed for '" + jdbcUrl + "': " + ex.getMessage(), ex);
        }
    }

    /** Opens a test connection to make sure the new database is reachable. */
    private void verifyConnection(String jdbcUrl) {
        try (HikariDataSource ds = buildTempDataSource(jdbcUrl);
             Connection conn = ds.getConnection()) {
            if (!conn.isValid(5)) {
                throw new TenantProvisioningException(
                        "Connection to '" + jdbcUrl + "' is not valid after provisioning");
            }
            log.info("Connection verified for '{}'", jdbcUrl);
        } catch (TenantProvisioningException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new TenantProvisioningException(
                    "Connection verification failed for '" + jdbcUrl + "': " + ex.getMessage(), ex);
        }
    }

    /** Drops a database that was created during a failed provisioning attempt. */
    private void cleanupDatabase(String dbName) {
        try (Connection conn = masterDataSource.getConnection()) {
            conn.setAutoCommit(true);
            // Terminate existing connections first (PostgreSQL requires this)
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate(
                        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity " +
                        "WHERE datname = '" + dbName + "' AND pid <> pg_backend_pid()");
            }
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("DROP DATABASE IF EXISTS \"" + dbName + "\"");
                log.info("Cleaned up orphaned database '{}'", dbName);
            }
        } catch (Exception ex) {
            log.error("Failed to clean up database '{}' — manual cleanup required: {}",
                    dbName, ex.getMessage());
        }
    }

    /** Builds a minimal single-connection HikariCP DataSource for schema ops. */
    private HikariDataSource buildTempDataSource(String jdbcUrl) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(jdbcUrl);
        ds.setUsername(masterUsername);
        ds.setPassword(masterPassword);
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setMaximumPoolSize(2);
        ds.setMinimumIdle(1);
        ds.setConnectionTimeout(30_000L);
        ds.setPoolName("provisioner-temp");
        return ds;
    }

    // -----------------------------------------------------------------------
    // Result type
    // -----------------------------------------------------------------------

    /**
     * Carries the auto-generated database name and JDBC URL back to the caller.
     */
    public record ProvisionResult(String databaseName, String jdbcUrl) {}
}
