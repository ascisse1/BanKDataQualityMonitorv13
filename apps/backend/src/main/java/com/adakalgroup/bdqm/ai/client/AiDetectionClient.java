package com.adakalgroup.bdqm.ai.client;

import com.adakalgroup.bdqm.ai.config.AiServiceProperties;
import com.adakalgroup.bdqm.ai.dto.*;
import com.adakalgroup.bdqm.ai.exception.AiServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client for communicating with the Python ML service.
 */
@Slf4j
public class AiDetectionClient {

    private final RestTemplate restTemplate;
    private final AiServiceProperties props;

    public AiDetectionClient(RestTemplate restTemplate, AiServiceProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
    }

    /**
     * Check if the ML service is healthy.
     */
    public boolean isHealthy() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity("/health", Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return "healthy".equals(response.getBody().get("status"));
            }
            return false;
        } catch (Exception e) {
            log.debug("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get ML service health details.
     */
    public HealthResponse getHealth() {
        try {
            long start = System.currentTimeMillis();
            ResponseEntity<HealthResponse> response =
                restTemplate.getForEntity("/health", HealthResponse.class);
            long latency = System.currentTimeMillis() - start;

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                HealthResponse health = response.getBody();
                health.setLatencyMs(latency);
                return health;
            }
            return HealthResponse.builder()
                .status("unhealthy")
                .modelsLoaded(false)
                .latencyMs(latency)
                .build();
        } catch (Exception e) {
            return HealthResponse.builder()
                .status("unreachable")
                .modelsLoaded(false)
                .error(e.getMessage())
                .build();
        }
    }

    /**
     * Score records for risk.
     */
    public RiskScoreResponse scoreRecords(RiskScoreRequest request) {
        return post("/score", request, RiskScoreResponse.class, "scoreRecords");
    }

    /**
     * Get correction suggestion.
     */
    public SuggestionResponse getSuggestion(SuggestionRequest request) {
        return post("/suggest", request, SuggestionResponse.class, "getSuggestion");
    }

    /**
     * Get bulk suggestions.
     */
    public BulkSuggestionResponse getBulkSuggestions(BulkSuggestionRequest request) {
        return post("/suggest/bulk", request, BulkSuggestionResponse.class, "getBulkSuggestions");
    }

    /**
     * Generic POST request to ML service.
     */
    private <T, R> R post(String path, T request, Class<R> responseType, String operation) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<T> entity = new HttpEntity<>(request, headers);

            log.debug("Calling ML service: {} {}", operation, path);
            long start = System.currentTimeMillis();

            ResponseEntity<R> response = restTemplate.exchange(
                path,
                HttpMethod.POST,
                entity,
                responseType
            );

            log.debug("ML service {} completed in {}ms", operation,
                System.currentTimeMillis() - start);

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }

            throw AiServiceException.modelError(operation,
                "Unexpected status: " + response.getStatusCode());

        } catch (ResourceAccessException e) {
            throw AiServiceException.unavailable(e.getMessage());
        } catch (RestClientException e) {
            throw new AiServiceException("ML service request failed: " + operation, e);
        }
    }

    /**
     * Health response from ML service.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class HealthResponse {
        private String status;
        private boolean modelsLoaded;
        private long latencyMs;
        private String error;
        private Map<String, Object> models;
    }
}
