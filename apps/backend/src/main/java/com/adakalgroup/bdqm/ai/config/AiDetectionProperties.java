package com.adakalgroup.bdqm.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for the AI Detection module.
 * All properties are optional and have sensible defaults.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.features.ai-detection")
public class AiDetectionProperties {

    /**
     * Master switch to enable/disable the entire AI Detection module.
     * When false, all AI-related beans are not created and endpoints return 404.
     */
    private boolean enabled = false;

    /**
     * Enable risk scoring feature.
     * Pre-validation ML scoring to prioritize high-risk records.
     */
    private boolean riskScoring = true;

    /**
     * Enable correction suggestions feature.
     * ML-based suggestions for fixing anomalies.
     */
    private boolean correctionSuggestions = true;

    /**
     * Enable anomaly clustering feature.
     * Group similar anomalies for root cause analysis.
     */
    private boolean clustering = false;

    /**
     * Auto-apply suggestions with confidence above this threshold.
     * Set to 1.0 to disable auto-apply.
     */
    private double autoApplyThreshold = 0.95;
}
