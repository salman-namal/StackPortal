package com.stackportal.tenant.resolver;

import com.stackportal.repository.master.TenantRepository;
import com.stackportal.tenant.datasource.TenantDataSourceManager;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class PlatformRequestTenantResolutionTest {
    @Test
    void platformTenantManagementDoesNotEnterTenantResolution() {
        TenantResolutionFilter filter = new TenantResolutionFilter(
                mock(TenantRepository.class), mock(TenantDataSourceManager.class));
        assertThat(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/api/tenants"))).isTrue();
        assertThat(filter.shouldNotFilter(new MockHttpServletRequest("POST", "/api/auth/platform/login"))).isTrue();
    }
}

