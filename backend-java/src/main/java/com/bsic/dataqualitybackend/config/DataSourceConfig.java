package com.bsic.dataqualitybackend.config;

<<<<<<< HEAD
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
=======
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

<<<<<<< HEAD
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
=======
@Configuration
public class DataSourceConfig {

    @Primary
    @Bean(name = "primaryDataSource")
    @ConfigurationProperties("spring.datasource.primary.hikari")
    public DataSource primaryDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(System.getenv().getOrDefault("DB_URL",
            "jdbc:mysql://localhost:3306/bank_data_quality?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"));
        config.setUsername(System.getenv().getOrDefault("DB_USER", "root"));
        config.setPassword(System.getenv().getOrDefault("DB_PASSWORD", ""));
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setPoolName("MySQLPool");
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }

    @Bean(name = "informixDataSource")
    @ConfigurationProperties("spring.datasource.informix.hikari")
    public DataSource informixDataSource() {
        HikariConfig config = new HikariConfig();

        String host = System.getenv().getOrDefault("INFORMIX_HOST", "10.3.0.66");
        String port = System.getenv().getOrDefault("INFORMIX_PORT", "1526");
        String database = System.getenv().getOrDefault("INFORMIX_DATABASE", "bdmsa");
        String server = System.getenv().getOrDefault("INFORMIX_SERVER", "ol_bdmsa");
        String user = System.getenv().getOrDefault("INFORMIX_USER", "bank");
        String password = System.getenv().getOrDefault("INFORMIX_PASSWORD", "bank");

        String jdbcUrl = String.format(
            "jdbc:informix-sqli://%s:%s/%s:INFORMIXSERVER=%s;DELIMIDENT=Y;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8",
            host, port, database, server
        );

        config.setJdbcUrl(jdbcUrl);
        config.setUsername(user);
        config.setPassword(password);
        config.setDriverClassName("com.informix.jdbc.IfxDriver");
        config.setPoolName("InformixPool");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(1800000);
        config.setConnectionTestQuery("SELECT FIRST 1 1 FROM systables");

        return new HikariDataSource(config);
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
    }

    @Primary
    @Bean(name = "primaryJdbcTemplate")
    public JdbcTemplate primaryJdbcTemplate(@Qualifier("primaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean(name = "informixJdbcTemplate")
<<<<<<< HEAD
    @ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
=======
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
    public JdbcTemplate informixJdbcTemplate(@Qualifier("informixDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
