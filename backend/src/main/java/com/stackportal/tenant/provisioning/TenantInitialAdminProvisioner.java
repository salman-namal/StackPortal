package com.stackportal.tenant.provisioning;

import com.stackportal.common.exception.TenantProvisioningException;
import com.stackportal.service.auth.EmailService;
import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/** Seeds the first tenant administrator only in a database created for that tenant. */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantInitialAdminProvisioner {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%".toCharArray();

    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public InitialAdminInvitation provision(String jdbcUrl, String databaseUsername, String databasePassword,
                          String name, String email) {
        String username = usernameFromEmail(email);
        String temporaryPassword = temporaryPassword();
        try (HikariDataSource dataSource = new HikariDataSource()) {
            dataSource.setJdbcUrl(jdbcUrl);
            dataSource.setUsername(databaseUsername);
            dataSource.setPassword(databasePassword);
            dataSource.setDriverClassName("org.postgresql.Driver");
            dataSource.setMaximumPoolSize(1);
            try (Connection connection = dataSource.getConnection()) {
                connection.setAutoCommit(false);
                long roleId = roleId(connection);
                try (PreparedStatement user = connection.prepareStatement("""
                        INSERT INTO users (name, email, username, password, provider, active, email_verified, created_at, updated_at)
                        VALUES (?, ?, ?, ?, 'LOCAL', TRUE, TRUE, NOW(), NOW()) RETURNING id
                        """)) {
                    user.setString(1, name);
                    user.setString(2, email);
                    user.setString(3, username);
                    user.setString(4, passwordEncoder.encode(temporaryPassword));
                    try (ResultSet result = user.executeQuery()) {
                        if (!result.next()) throw new TenantProvisioningException("Could not create the initial tenant administrator");
                        try (PreparedStatement assignment = connection.prepareStatement("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")) {
                            assignment.setLong(1, result.getLong(1));
                            assignment.setLong(2, roleId);
                            assignment.executeUpdate();
                        }
                    }
                }
                connection.commit();
            }
        } catch (Exception exception) {
            throw new TenantProvisioningException("Failed to create the initial tenant administrator: " + exception.getMessage(), exception);
        }

        return new InitialAdminInvitation(name, email, username, temporaryPassword);
    }

    private long roleId(Connection connection) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("SELECT id FROM roles WHERE role_name = 'ADMIN'");
             ResultSet result = statement.executeQuery()) {
            if (!result.next()) throw new TenantProvisioningException("The tenant ADMIN role was not initialized");
            return result.getLong(1);
        }
    }

    private String usernameFromEmail(String email) {
        String candidate = email.substring(0, email.indexOf('@')).replaceAll("[^A-Za-z0-9._-]", "_");
        return candidate.isBlank() ? "admin" : candidate.substring(0, Math.min(candidate.length(), 150));
    }

    private String temporaryPassword() {
        StringBuilder result = new StringBuilder(14);
        for (int index = 0; index < 14; index++) result.append(PASSWORD_CHARS[RANDOM.nextInt(PASSWORD_CHARS.length)]);
        return result.toString();
    }

    public InitialAdminInvitation resetAdminPassword(String jdbcUrl, String databaseUsername, String databasePassword, String email) {
        String password = temporaryPassword();
        try (HikariDataSource ds = new HikariDataSource()) {
            ds.setJdbcUrl(jdbcUrl); ds.setUsername(databaseUsername); ds.setPassword(databasePassword); ds.setMaximumPoolSize(1);
            try (Connection connection = ds.getConnection(); PreparedStatement statement = connection.prepareStatement("UPDATE users SET password = ?, active = TRUE, email_verified = TRUE, updated_at = NOW() WHERE lower(email) = lower(?) AND id IN (SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.role_name = 'ADMIN') RETURNING name, email, username")) {
                statement.setString(1, passwordEncoder.encode(password)); statement.setString(2, email);
                try (ResultSet result = statement.executeQuery()) {
                    if (!result.next()) throw new TenantProvisioningException("Initial tenant administrator was not found");
                    return new InitialAdminInvitation(result.getString("name"), result.getString("email"), result.getString("username"), password);
                }
            }
        } catch (TenantProvisioningException ex) { throw ex; } catch (Exception ex) { throw new TenantProvisioningException("Failed to reset tenant administrator password: " + ex.getMessage(), ex); }
    }

    public InitialAdminInvitation administratorAccess(String jdbcUrl, String databaseUsername, String databasePassword) {
        try (HikariDataSource ds = new HikariDataSource()) {
            ds.setJdbcUrl(jdbcUrl); ds.setUsername(databaseUsername); ds.setPassword(databasePassword); ds.setMaximumPoolSize(1);
            try (Connection connection = ds.getConnection(); PreparedStatement statement = connection.prepareStatement("SELECT u.name, u.email, u.username FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.role_name = 'ADMIN' ORDER BY u.id LIMIT 1"); ResultSet result = statement.executeQuery()) {
                if (!result.next()) throw new TenantProvisioningException("Initial tenant administrator was not found");
                return new InitialAdminInvitation(result.getString("name"), result.getString("email"), result.getString("username"), null);
            }
        } catch (TenantProvisioningException ex) { throw ex; } catch (Exception ex) { throw new TenantProvisioningException("Failed to load tenant administrator access details: " + ex.getMessage(), ex); }
    }
    public record InitialAdminInvitation(String name, String email, String username, String temporaryPassword) { }
}
