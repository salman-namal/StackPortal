package com.stackportal.tenant.migration;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Runs tenant-scoped Flyway migrations against an explicitly supplied datasource. */
@Slf4j
@Service
public class TenantMigrationRunner {

    private final String location;
    private final boolean baselineOnMigrate;
    private final boolean validateOnMigrate;

    public TenantMigrationRunner(
            @Value("${app.database.migration.tenant-location}") String location,
            @Value("${app.database.migration.baseline-on-migrate:false}") boolean baselineOnMigrate,
            @Value("${app.database.migration.validate-on-migrate:true}") boolean validateOnMigrate) {
        this.location = location;
        this.baselineOnMigrate = baselineOnMigrate;
        this.validateOnMigrate = validateOnMigrate;
    }

    /** Used only for a database created in the current provisioning request. */
    public void migrateNewTenant(String jdbcUrl, String username, String password) {
        Flyway.configure()
                .dataSource(jdbcUrl, username, password)
                .locations(location)
                .baselineOnMigrate(false)
                .validateOnMigrate(validateOnMigrate)
                .load()
                .migrate();
        log.info("Tenant schema migrated successfully for newly provisioned database");
    }

    /** Existing tenants require a prior compatibility report and explicit approval. */
    public void migrateExistingTenant(String jdbcUrl, String username, String password) {
        if (!baselineOnMigrate) {
            throw new IllegalStateException("Existing tenant migration is disabled until baseline compatibility is approved");
        }
        Flyway.configure()
                .dataSource(jdbcUrl, username, password)
                .locations(location)
                .baselineOnMigrate(true)
                .baselineVersion("3")
                .validateOnMigrate(validateOnMigrate)
                .load()
                .migrate();
    }
}
