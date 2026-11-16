package com.stackportal.database.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.ResultSet;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
class TenantFlywayMigrationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("tenant_migration_test")
            .withUsername("test")
            .withPassword("test");

    @Test
    void migratesFreshMasterAndTenantSchemasIndependently() throws Exception {
        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration/master")
                .load()
                .migrate();

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration/tenant")
                .load()
                .migrate();

        try (Connection connection = POSTGRES.createConnection("");
             ResultSet result = connection.createStatement()
                     .executeQuery("SELECT COUNT(*) FROM roles")) {
            result.next();
            assertThat(result.getInt(1)).isEqualTo(4);
        }

        try (Connection connection = POSTGRES.createConnection("");
             ResultSet result = connection.createStatement()
                     .executeQuery("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tenants'")) {
            result.next();
            assertThat(result.getInt(1)).isEqualTo(1);
        }
    }
}
