package com.stackportal.tenant.config;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.stackportal.repository.master",
        entityManagerFactoryRef = "masterEntityManagerFactory",
        transactionManagerRef = "masterTransactionManager"
)
public class MasterDataSourceConfig {

    @Value("${app.datasource.master.maximum-pool-size:20}")
    private int maximumPoolSize;

    @Value("${app.datasource.master.minimum-idle:5}")
    private int minimumIdle;

    @Value("${app.datasource.master.idle-timeout:600000}")
    private long idleTimeout;

    @Value("${app.datasource.master.connection-timeout:30000}")
    private long connectionTimeout;

    @Value("${app.datasource.master.max-lifetime:1800000}")
    private long maxLifetime;

    @Bean
    @Primary
    @ConfigurationProperties("app.datasource.master")
    public DataSourceProperties masterDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "masterDataSource")
    @Primary
    public DataSource masterDataSource(
            @Qualifier("masterDataSourceProperties")
            DataSourceProperties properties) {

        HikariDataSource dataSource = properties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        // DataSourceProperties does not bind Hikari-specific settings itself.
        // Bind these explicitly until this configuration is converted to a
        // dedicated Hikari properties object.
        dataSource.setPoolName("master-pool");
        dataSource.setMaximumPoolSize(maximumPoolSize);
        dataSource.setMinimumIdle(minimumIdle);
        dataSource.setIdleTimeout(idleTimeout);
        dataSource.setConnectionTimeout(connectionTimeout);
        dataSource.setMaxLifetime(maxLifetime);
        return dataSource;
    }

    @Bean(name = "masterEntityManagerFactory")
    @Primary
    public LocalContainerEntityManagerFactoryBean masterEntityManagerFactory(
            @Qualifier("masterDataSource")
            DataSource dataSource) {

        LocalContainerEntityManagerFactoryBean factory =
                new LocalContainerEntityManagerFactoryBean();

        factory.setDataSource(dataSource);

        factory.setPackagesToScan(
                "com.stackportal.entity.master"
        );

        factory.setJpaVendorAdapter(
                new HibernateJpaVendorAdapter()
        );

        Map<String, Object> properties = new HashMap<>();

        properties.put(
                "hibernate.hbm2ddl.auto",
                "update"
        );

        properties.put(
                "hibernate.dialect",
                "org.hibernate.dialect.PostgreSQLDialect"
        );

        factory.setJpaPropertyMap(properties);

        return factory;
    }

    @Bean(name = "masterTransactionManager")
    @Primary
    public PlatformTransactionManager masterTransactionManager(
            @Qualifier("masterEntityManagerFactory")
            EntityManagerFactory entityManagerFactory) {

        return new JpaTransactionManager(entityManagerFactory);
    }
}
