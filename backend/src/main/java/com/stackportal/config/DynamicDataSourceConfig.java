package com.stackportal.config;

import com.stackportal.tenant.datasource.TenantRoutingDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.HashMap;

@Configuration
public class DynamicDataSourceConfig {

    @Bean(name = "dynamicTenantDataSource")
    public DataSource dynamicTenantDataSource(
            @Qualifier("masterDataSource") DataSource masterDataSource) {

        TenantRoutingDataSource routingDataSource =
                new TenantRoutingDataSource();

        // Fall back to the master datasource when no tenant context is set
        // (e.g. auth or tenant-management requests).
        routingDataSource.setDefaultTargetDataSource(masterDataSource);

        routingDataSource.setTargetDataSources(
                new HashMap<>()
        );

        routingDataSource.afterPropertiesSet();

        return routingDataSource;
    }
}