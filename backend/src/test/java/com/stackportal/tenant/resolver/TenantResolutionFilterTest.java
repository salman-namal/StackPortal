package com.stackportal.tenant.resolver;

import com.stackportal.entity.master.Tenant;
import com.stackportal.entity.master.TenantStatus;
import com.stackportal.repository.master.TenantRepository;
import com.stackportal.tenant.context.TenantContext;
import com.stackportal.tenant.datasource.TenantDataSourceManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TenantResolutionFilterTest {

    @AfterEach
    void clearTenantContext() {
        TenantContext.clear();
    }

    @Test
    void resolvesTheTenantBeforeContinuingAndAlwaysClearsTheContext() throws Exception {
        TenantRepository tenantRepository = mock(TenantRepository.class);
        TenantDataSourceManager dataSourceManager = mock(TenantDataSourceManager.class);
        Tenant tenant = Tenant.builder()
                .id(42L)
                .code("acme")
                .status(TenantStatus.ACTIVE)
                .build();
        when(tenantRepository.findByCode("acme")).thenReturn(Optional.of(tenant));
        when(dataSourceManager.isRegistered(42L)).thenReturn(true);

        TenantResolutionFilter filter = new TenantResolutionFilter(tenantRepository, dataSourceManager);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader(TenantResolutionFilter.TENANT_HEADER, "acme");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) ->
                assertThat(TenantContext.getTenantId()).isEqualTo(42L));

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(TenantContext.getTenantId()).isNull();
        verify(tenantRepository).findByCode("acme");
        verify(dataSourceManager).isRegistered(42L);
    }
}
