package com.stackportal.database.migration;

import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

class SchemaCompatibilityValidatorTest {

    @Test
    void reportsMissingTenantTablesFromJdbcMetadata() throws Exception {
        try (Connection connection = DriverManager.getConnection("jdbc:h2:mem:compatibility;MODE=PostgreSQL");
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE users (id BIGINT)");

            var report = SchemaCompatibilityValidator.inspectTenant(connection);

            assertThat(report.compatible()).isFalse();
            assertThat(report.missingTables()).contains("roles", "refresh_tokens");
        }
    }
}
