package com.stackportal.database.migration;

import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Explicit master migration entry point; it is never invoked automatically. */
@Service
@RequiredArgsConstructor
public class MasterMigrationRunner {

    @Qualifier("masterDataSource")
    private final DataSource masterDataSource;

    @Value("${app.database.migration.master-location}")
    private String location;

    @Value("${app.database.migration.validate-on-migrate:true}")
    private boolean validateOnMigrate;

    public void migrateFreshMaster() {
        Flyway.configure()
                .dataSource(masterDataSource)
                .locations(location)
                .baselineOnMigrate(false)
                .validateOnMigrate(validateOnMigrate)
                .load()
                .migrate();
    }
}
