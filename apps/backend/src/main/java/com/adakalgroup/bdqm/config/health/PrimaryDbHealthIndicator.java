package com.adakalgroup.bdqm.config.health;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Custom health indicator for PostgreSQL primary database with connection pool details.
 */
@Slf4j
@Component("primaryDatabase")
public class PrimaryDbHealthIndicator implements HealthIndicator {

    private final HikariDataSource primaryDataSource;

    public PrimaryDbHealthIndicator(@Qualifier("primaryDataSource") HikariDataSource primaryDataSource) {
        this.primaryDataSource = primaryDataSource;
    }

    @Override
    public Health health() {
        try {
            return checkConnection();
        } catch (Exception e) {
            log.error("Primary database health check failed", e);
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("database", "PostgreSQL Primary")
                    .build();
        }
    }

    private Health checkConnection() {
        long startTime = System.currentTimeMillis();

        try (Connection connection = primaryDataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT 1")) {

            long responseTime = System.currentTimeMillis() - startTime;

            if (resultSet.next()) {
                return Health.up()
                        .withDetail("database", "PostgreSQL Primary")
                        .withDetail("pool", primaryDataSource.getPoolName())
                        .withDetail("activeConnections", primaryDataSource.getHikariPoolMXBean().getActiveConnections())
                        .withDetail("idleConnections", primaryDataSource.getHikariPoolMXBean().getIdleConnections())
                        .withDetail("totalConnections", primaryDataSource.getHikariPoolMXBean().getTotalConnections())
                        .withDetail("threadsAwaitingConnection", primaryDataSource.getHikariPoolMXBean().getThreadsAwaitingConnection())
                        .withDetail("maxPoolSize", primaryDataSource.getMaximumPoolSize())
                        .withDetail("responseTimeMs", responseTime)
                        .build();
            } else {
                return Health.down()
                        .withDetail("database", "PostgreSQL Primary")
                        .withDetail("error", "Query returned no results")
                        .build();
            }
        } catch (Exception e) {
            log.error("Failed to connect to PostgreSQL", e);
            return Health.down()
                    .withDetail("database", "PostgreSQL Primary")
                    .withDetail("error", e.getMessage())
                    .withDetail("pool", primaryDataSource.getPoolName())
                    .build();
        }
    }
}
