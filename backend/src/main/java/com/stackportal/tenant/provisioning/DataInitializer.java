package com.stackportal.tenant.provisioning;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Coordinates no schema changes by default.
 *
 * <p>The previous implementation repeatedly replayed tenant SQL, applied
 * fallback DDL, and created a predictable administrator at every startup.
 * Flyway is now the only supported schema mechanism. Existing databases must
 * be inspected and explicitly baselined before their migrations are enabled.</p>
 */
@Slf4j
@Component
public class DataInitializer {

    private final boolean migrationEnabled;

    public DataInitializer(@Value("${app.database.migration.enabled:false}") boolean migrationEnabled) {
        this.migrationEnabled = migrationEnabled;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!migrationEnabled) {
            log.info("Database migration execution is disabled pending schema compatibility approval");
            return;
        }
        log.info("Database migration execution is enabled; existing tenant migrations require explicit coordinator approval");
    }
}
