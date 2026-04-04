package com.adakalgroup.bdqm.config.health;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Properties;

/**
 * Custom health indicator for Redis cache connectivity.
 * Provides detailed Redis server information and connection pool status.
 */
@Slf4j
@Component("redisCache")
@RequiredArgsConstructor
public class RedisHealthIndicator implements HealthIndicator {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisConnectionFactory connectionFactory;

    @Override
    public Health health() {
        try {
            return checkRedisConnection();
        } catch (Exception e) {
            log.error("Redis health check failed", e);
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("service", "Redis Cache")
                    .build();
        }
    }

    private Health checkRedisConnection() {
        long startTime = System.currentTimeMillis();

        try (RedisConnection connection = connectionFactory.getConnection()) {
            // Ping Redis server
            String pingResult = connection.ping();
            long responseTime = System.currentTimeMillis() - startTime;

            if ("PONG".equals(pingResult)) {
                Health.Builder builder = Health.up()
                        .withDetail("service", "Redis Cache")
                        .withDetail("responseTimeMs", responseTime);

                // Get Redis server info
                try {
                    Properties info = connection.serverCommands().info();
                    if (info != null) {
                        builder.withDetail("redisVersion", info.getProperty("redis_version", "unknown"))
                               .withDetail("usedMemory", info.getProperty("used_memory_human", "unknown"))
                               .withDetail("connectedClients", info.getProperty("connected_clients", "unknown"))
                               .withDetail("uptimeInSeconds", info.getProperty("uptime_in_seconds", "unknown"));

                        // Keyspace info
                        String db0 = info.getProperty("db0");
                        if (db0 != null) {
                            builder.withDetail("db0", db0);
                        }
                    }
                } catch (Exception e) {
                    log.debug("Could not retrieve Redis server info: {}", e.getMessage());
                }

                return builder.build();
            } else {
                return Health.down()
                        .withDetail("service", "Redis Cache")
                        .withDetail("error", "Unexpected ping response: " + pingResult)
                        .build();
            }
        } catch (Exception e) {
            log.error("Failed to connect to Redis", e);
            return Health.down()
                    .withDetail("service", "Redis Cache")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
