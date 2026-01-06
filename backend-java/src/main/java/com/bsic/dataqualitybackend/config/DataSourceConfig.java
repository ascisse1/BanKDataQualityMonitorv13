package com.bsic.dataqualitybackend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.primary.jdbc-url}")
    private String primaryJdbcUrl;

    @Value("${spring.datasource.primary.username}")
    private String primaryUsername;

    @Value("${spring.datasource.primary.password}")
    private String primaryPassword;

    @Primary
    @Bean(name = "primaryDataSource")
    public DataSource primaryDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(System.getenv().getOrDefault("DB_URL", primaryJdbcUrl));
        config.setUsername(System.getenv().getOrDefault("DB_USER", primaryUsername));
        config.setPassword(System.getenv().getOrDefault("DB_PASSWORD", primaryPassword));
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
    @ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
    public DataSource informixDataSource() {
        log.info("🔗 Initializing Informix DataSource (JDBC)...");

        try {
            HikariConfig config = new HikariConfig();

            String host = System.getenv().getOrDefault("INFORMIX_HOST", "10.3.0.66");
            String port = System.getenv().getOrDefault("INFORMIX_PORT", "1526");
            String database = System.getenv().getOrDefault("INFORMIX_DATABASE", "bdmsa");
            String server = System.getenv().getOrDefault("INFORMIX_SERVER", "ol_bdmsa");
            String user = System.getenv().getOrDefault("INFORMIX_USER", "bank");
            String password = System.getenv().getOrDefault("INFORMIX_PASSWORD", "bank");

            // Configuration avec locale française ISO 8859-1 (standard Informix)
            String jdbcUrl = String.format(
                "jdbc:informix-sqli://%s:%s/%s:INFORMIXSERVER=%s;DELIMIDENT=Y;DB_LOCALE=fr_FR.819;CLIENT_LOCALE=fr_FR.819",
                host, port, database, server
            );

            log.info("   JDBC URL: {}", jdbcUrl.replaceAll(":[^:]+@", ":****@"));

            config.setJdbcUrl(jdbcUrl);
            config.setUsername(user);
            config.setPassword(password);
            config.setDriverClassName("com.informix.jdbc.IfxDriver");
            config.setPoolName("InformixPool");
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(1);
            config.setConnectionTimeout(10000);
            config.setIdleTimeout(300000);
            config.setMaxLifetime(1800000);
            config.setConnectionTestQuery("SELECT FIRST 1 1 FROM systables");
            config.setInitializationFailTimeout(-1); // Ne pas échouer au démarrage

            HikariDataSource dataSource = new HikariDataSource(config);
            log.info("✅ Informix DataSource initialized successfully");
            return dataSource;

        } catch (Exception e) {
            log.error("❌ Failed to initialize Informix DataSource: {}", e.getMessage());
            log.warn("⚠️  Application will start in DEGRADED MODE without Informix");
            throw e;
        }
    }

    @Primary
    @Bean(name = "primaryJdbcTemplate")
    public JdbcTemplate primaryJdbcTemplate(@Qualifier("primaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean(name = "informixJdbcTemplate")
    @ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
    public JdbcTemplate informixJdbcTemplate(@Qualifier("informixDataSource") DataSource dataSource) {
        log.info("✅ Informix JdbcTemplate configured");
        return new JdbcTemplate(dataSource);
    }
}
