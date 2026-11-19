package com.stackportal.controller.user;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.assertj.core.api.Assertions.assertThat;

class UserControllerAuthorizationTest {

    @Test
    void restrictsTenantUserManagementToTenantAdmins() {
        PreAuthorize authorization = UserController.class.getAnnotation(PreAuthorize.class);

        assertThat(authorization).isNotNull();
        assertThat(authorization.value()).isEqualTo("hasRole('ADMIN')");
    }
}
