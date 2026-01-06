package com.bsic.dataqualitybackend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Multi-datasource configuration using HikariCP connection pooling.
 * Properties are bound from application.yml under spring.datasource.primary and spring.datasource.informix.
 */
@Configuration
public class DataSourceConfig {

    /**
     * Primary MySQL DataSource with HikariCP.
     * Configuration properties from spring.datasource.primary.*
     */
    @Primary
    @Bean(name = "primaryDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public HikariDataSource primaryDataSource() {
        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .build();
    }

    /**
     * Secondary Informix DataSource with HikariCP.
     * Only created when informix-integration feature is enabled.
     * Configuration properties from spring.datasource.informix.*
     */
    @Bean(name = "informixDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.informix")
    @ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
    public HikariDataSource informixDataSource() {
        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .build();
    }

    @Primary
    @Bean(name = "primaryJdbcTemplate")
    public JdbcTemplate primaryJdbcTemplate(@Qualifier("primaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean(name = "informixJdbcTemplate")
    @ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
    public JdbcTemplate informixJdbcTemplate(@Qualifier("informixDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
