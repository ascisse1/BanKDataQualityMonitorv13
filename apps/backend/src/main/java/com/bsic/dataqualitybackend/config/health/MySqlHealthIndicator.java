package com.bsic.dataqualitybackend.config.health;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Custom health indicator for MySQL primary database with connection pool details.
 */
@Slf4j
@Component("mysqlPrimary")
public class MySqlHealthIndicator implements HealthIndicator {

    private final HikariDataSource primaryDataSource;

    public MySqlHealthIndicator(@Qualifier("primaryDataSource") HikariDataSource primaryDataSource) {
        this.primaryDataSource = primaryDataSource;
    }

    @Override
    public Health health() {
        try {
            return checkMySqlConnection();
        } catch (Exception e) {
            log.error("MySQL health check failed", e);
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("database", "MySQL Primary")
                    .build();
        }
    }

    private Health checkMySqlConnection() {
        long startTime = System.currentTimeMillis();

        try (Connection connection = primaryDataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT 1")) {

            long responseTime = System.currentTimeMillis() - startTime;

            if (resultSet.next()) {
                return Health.up()
                        .withDetail("database", "MySQL Primary")
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
                        .withDetail("database", "MySQL Primary")
                        .withDetail("error", "Query returned no results")
                        .build();
            }
        } catch (Exception e) {
            log.error("Failed to connect to MySQL", e);
            return Health.down()
                    .withDetail("database", "MySQL Primary")
                    .withDetail("error", e.getMessage())
                    .withDetail("pool", primaryDataSource.getPoolName())
                    .build();
        }
    }
}
