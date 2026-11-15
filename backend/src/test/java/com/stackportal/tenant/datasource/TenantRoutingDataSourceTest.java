package com.stackportal.tenant.datasource;

import com.stackportal.tenant.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TenantRoutingDataSourceTest {

    @AfterEach
    void clearTenantContext() {
        TenantContext.clear();
    }

    @Test
    void routesToTheTenantDataSourceWhenContextIsPresent() throws Exception {
        DataSource masterDataSource = mock(DataSource.class);
        DataSource tenantDataSource = mock(DataSource.class);
        Connection tenantConnection = mock(Connection.class);
        when(tenantDataSource.getConnection()).thenReturn(tenantConnection);

        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource(masterDataSource);
        routingDataSource.addDataSource(42L, tenantDataSource);
        TenantContext.setTenantId(42L);

        assertThat(routingDataSource.getConnection()).isSameAs(tenantConnection);
        verify(tenantDataSource).getConnection();
        verifyNoInteractions(masterDataSource);
    }

    @Test
    void fallsBackToTheMasterDataSourceWithoutTenantContext() throws Exception {
        DataSource masterDataSource = mock(DataSource.class);
        Connection masterConnection = mock(Connection.class);
        when(masterDataSource.getConnection()).thenReturn(masterConnection);

        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource(masterDataSource);

        assertThat(routingDataSource.getConnection()).isSameAs(masterConnection);
        verify(masterDataSource).getConnection();
    }
}
