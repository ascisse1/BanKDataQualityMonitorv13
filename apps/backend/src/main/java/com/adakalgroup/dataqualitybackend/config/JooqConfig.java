package com.adakalgroup.dataqualitybackend.config;

import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * jOOQ configuration for dynamic SQL queries driven by CBS data dictionary.
 * Provides DSLContext beans for both primary (PostgreSQL) and Informix datasources.
 */
@Configuration
public class JooqConfig {

    @Bean(name = "primaryDsl")
    @Primary
    public DSLContext primaryDsl(@Qualifier("primaryDataSource") DataSource dataSource) {
        return DSL.using(dataSource, SQLDialect.POSTGRES);
    }

    @Bean(name = "informixDsl")
    @ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
    public DSLContext informixDsl(@Qualifier("informixDataSource") DataSource dataSource) {
        return DSL.using(dataSource, SQLDialect.DEFAULT);
    }
}
