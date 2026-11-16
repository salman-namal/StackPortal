package com.stackportal.database.migration;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashSet;
import java.util.Set;

/** Read-only metadata inspection used before baselining an existing database. */
public final class SchemaCompatibilityValidator {

    private SchemaCompatibilityValidator() { }

    public static CompatibilityReport inspectTenant(Connection connection) throws SQLException {
        Set<String> required = Set.of("roles", "users", "user_roles", "refresh_tokens",
                "password_reset_tokens", "email_verification_tokens");
        return inspect(connection, required);
    }

    public static CompatibilityReport inspectMaster(Connection connection) throws SQLException {
        return inspect(connection, Set.of("tenants"));
    }

    private static CompatibilityReport inspect(Connection connection, Set<String> required) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        Set<String> present = new LinkedHashSet<>();
        try (ResultSet tables = metadata.getTables(null, "public", "%", new String[] {"TABLE"})) {
            while (tables.next()) present.add(tables.getString("TABLE_NAME").toLowerCase());
        }
        Set<String> missing = new LinkedHashSet<>(required);
        missing.removeAll(present);
        return new CompatibilityReport(present, missing, missing.isEmpty());
    }

    public record CompatibilityReport(Set<String> presentTables, Set<String> missingTables, boolean compatible) { }
}
