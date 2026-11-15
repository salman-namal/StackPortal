package com.stackportal.tenant.config;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import static org.assertj.core.api.Assertions.assertThat;

class PersistencePackageConfigurationTest {

    @Test
    void keepsMasterRepositoriesOnTheMasterTransactionManager() {
        EnableJpaRepositories configuration = MasterDataSourceConfig.class
                .getAnnotation(EnableJpaRepositories.class);

        assertThat(configuration.basePackages()).containsExactly("com.stackportal.repository.master");
        assertThat(configuration.entityManagerFactoryRef()).isEqualTo("masterEntityManagerFactory");
        assertThat(configuration.transactionManagerRef()).isEqualTo("masterTransactionManager");
    }

    @Test
    void keepsTenantRepositoriesOnTheTenantTransactionManager() {
        EnableJpaRepositories configuration = TenantDataSourceConfig.class
                .getAnnotation(EnableJpaRepositories.class);

        assertThat(configuration.basePackages()).containsExactly("com.stackportal.repository.tenant");
        assertThat(configuration.entityManagerFactoryRef()).isEqualTo("tenantEntityManagerFactory");
        assertThat(configuration.transactionManagerRef()).isEqualTo("tenantTransactionManager");
    }
}
