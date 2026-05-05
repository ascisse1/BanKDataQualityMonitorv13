package com.adakalgroup.bdqm.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for the AI ML Service connection.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.ai.service")
public class AiServiceProperties {

    /**
     * Base URL of the Python ML service.
     */
    private String url = "http://localhost:8000";

    /**
     * Request timeout in milliseconds.
     */
    private int timeoutMs = 5000;

    /**
     * Maximum retry attempts on failure.
     */
    private int maxRetries = 2;

    /**
     * Whether to continue without AI features if the service is unavailable.
     * When true, the system gracefully degrades to SQL-only validation.
     */
    private boolean fallbackOnError = true;

    /**
     * Maximum concurrent calls to the AI service.
     */
    private int maxConcurrentCalls = 4;

    /**
     * Batch size for bulk scoring requests.
     */
    private int batchSize = 100;
}
