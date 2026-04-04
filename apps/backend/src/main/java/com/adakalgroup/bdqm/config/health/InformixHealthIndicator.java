package com.adakalgroup.bdqm.config.health;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Custom health indicator for Informix CBS database connectivity.
 * Only active when informix-integration feature is enabled.
 */
@Slf4j
@Component("informixCbs")
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class InformixHealthIndicator implements HealthIndicator {

    private final HikariDataSource informixDataSource;

    public InformixHealthIndicator(@Qualifier("informixDataSource") HikariDataSource informixDataSource) {
        this.informixDataSource = informixDataSource;
    }

    @Override
    public Health health() {
        try {
            return checkInformixConnection();
        } catch (Exception e) {
            log.error("Informix CBS health check failed", e);
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("database", "Informix CBS")
                    .build();
        }
    }

    private Health checkInformixConnection() {
        long startTime = System.currentTimeMillis();

        try (Connection connection = informixDataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT FIRST 1 1 FROM systables")) {

            long responseTime = System.currentTimeMillis() - startTime;

            if (resultSet.next()) {
                return Health.up()
                        .withDetail("database", "Informix CBS")
                        .withDetail("pool", informixDataSource.getPoolName())
                        .withDetail("activeConnections", informixDataSource.getHikariPoolMXBean().getActiveConnections())
                        .withDetail("idleConnections", informixDataSource.getHikariPoolMXBean().getIdleConnections())
                        .withDetail("totalConnections", informixDataSource.getHikariPoolMXBean().getTotalConnections())
                        .withDetail("threadsAwaitingConnection", informixDataSource.getHikariPoolMXBean().getThreadsAwaitingConnection())
                        .withDetail("responseTimeMs", responseTime)
                        .build();
            } else {
                return Health.down()
                        .withDetail("database", "Informix CBS")
                        .withDetail("error", "Query returned no results")
                        .build();
            }
        } catch (Exception e) {
            log.error("Failed to connect to Informix CBS", e);
            return Health.down()
                    .withDetail("database", "Informix CBS")
                    .withDetail("error", e.getMessage())
                    .withDetail("pool", informixDataSource.getPoolName())
                    .build();
        }
    }
}
