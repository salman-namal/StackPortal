package com.stackportal.controller.user;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * P0 regression test for Issue #19. It intentionally fails until the approved
 * server-side user-management policy is enforced independently of the UI.
 */
class UserControllerRbacRegressionTest {

    @Test
    void restrictsEveryUserManagementEndpointToAdmins() {
        PreAuthorize authorization = UserController.class.getAnnotation(PreAuthorize.class);

        assertThat(authorization)
                .as("/api/users must reject USER and MANAGER at the backend")
                .isNotNull();
        assertThat(authorization.value())
                .contains("SUPER_ADMIN")
                .contains("ADMIN");
    }
}
