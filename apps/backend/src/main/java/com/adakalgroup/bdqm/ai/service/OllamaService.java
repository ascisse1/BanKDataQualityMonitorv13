package com.adakalgroup.bdqm.ai.service;

import com.adakalgroup.bdqm.ai.config.AiDetectionProperties;
import com.adakalgroup.bdqm.ai.dto.SuggestionResponse;
import com.adakalgroup.bdqm.ai.model.ConfidenceLevel;
import com.adakalgroup.bdqm.ai.model.SuggestionSource;
import com.adakalgroup.bdqm.model.Anomaly;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Semaphore;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Ollama LLM service for AI explanations and fallback suggestions.
 * Used when ML models don't have enough training data.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.features.ai-detection.enabled", havingValue = "true")
public class OllamaService {

    private static final String SYSTEM_PROMPT = """
        Tu es un assistant expert en qualite des donnees bancaires. Tu reponds en francais,
        de maniere precise et concise. Tu ne dois jamais inventer de donnees.
        """;

    private static final Pattern SUGGESTION_PATTERN = Pattern.compile(
        "VALEUR:\\s*\\[?([^\\]|]+)\\]?\\s*\\|\\s*CONFIANCE:\\s*(HAUTE|MOYENNE|BASSE)\\s*\\|\\s*RAISON:\\s*(.+)",
        Pattern.CASE_INSENSITIVE
    );

    private final ChatClient chatClient;
    private final RestTemplate restTemplate;
    private final String ollamaBaseUrl;
    private final Semaphore llmSemaphore = new Semaphore(2);

    public OllamaService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) ChatClient chatClient,
            RestTemplate restTemplate,
            @Value("${spring.ai.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl) {
        this.chatClient = chatClient;
        this.restTemplate = restTemplate;
        this.ollamaBaseUrl = ollamaBaseUrl;
        log.info("Ollama service initialized (base URL: {})", ollamaBaseUrl);
    }

    /**
     * Check if Ollama is available.
     */
    public boolean isAvailable() {
        if (chatClient == null) {
            return false;
        }
        try {
            restTemplate.getForObject(ollamaBaseUrl + "/api/tags", String.class);
            return true;
        } catch (Exception e) {
            log.debug("Ollama not available: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Generate explanation for an anomaly.
     */
    public Optional<String> explainAnomaly(Anomaly anomaly) {
        if (chatClient == null || !isAvailable()) {
            return Optional.empty();
        }

        String prompt = String.format("""
            Explique brievement cette anomalie bancaire:

            - Champ: %s
            - Valeur actuelle: "%s"
            - Erreur: %s
            - Message: %s

            Donne une explication claire en 2-3 phrases.
            """,
            anomaly.getFieldName(),
            anomaly.getCurrentValue(),
            anomaly.getErrorType(),
            anomaly.getErrorMessage()
        );

        return callOllama(prompt);
    }

    /**
     * Generate correction suggestion using LLM (fallback when ML model unavailable).
     */
    public Optional<SuggestionResponse> suggestCorrection(Anomaly anomaly) {
        if (chatClient == null || !isAvailable()) {
            return Optional.empty();
        }

        String prompt = String.format("""
            Pour cette anomalie bancaire, propose la valeur corrigee:

            - Champ: %s
            - Valeur actuelle: "%s"
            - Valeur attendue: "%s"
            - Type d'erreur: %s
            - Type client: %s

            Reponds UNIQUEMENT avec ce format:
            VALEUR: [valeur] | CONFIANCE: [HAUTE/MOYENNE/BASSE] | RAISON: [justification]
            """,
            anomaly.getFieldName(),
            anomaly.getCurrentValue() != null ? anomaly.getCurrentValue() : "",
            anomaly.getExpectedValue() != null ? anomaly.getExpectedValue() : "non specifie",
            anomaly.getErrorType(),
            anomaly.getClientType()
        );

        return callOllama(prompt).flatMap(response -> parseSuggestionResponse(response, anomaly));
    }

    /**
     * Parse LLM response into SuggestionResponse.
     */
    private Optional<SuggestionResponse> parseSuggestionResponse(String response, Anomaly anomaly) {
        try {
            Matcher matcher = SUGGESTION_PATTERN.matcher(response.trim());
            if (matcher.find()) {
                String value = matcher.group(1).trim();
                String confidenceStr = matcher.group(2).toUpperCase();
                String reason = matcher.group(3).trim();

                ConfidenceLevel confidence = switch (confidenceStr) {
                    case "HAUTE" -> ConfidenceLevel.HIGH;
                    case "MOYENNE" -> ConfidenceLevel.MEDIUM;
                    default -> ConfidenceLevel.LOW;
                };

                double confidenceScore = switch (confidence) {
                    case HIGH -> 0.85;
                    case MEDIUM -> 0.65;
                    case LOW -> 0.4;
                };

                return Optional.of(SuggestionResponse.builder()
                    .anomalyId(anomaly.getId())
                    .suggestedValue(value)
                    .confidence(confidenceScore)
                    .confidenceLevel(confidence)
                    .source(SuggestionSource.LLM_FALLBACK)
                    .explanation(reason)
                    .modelVersion("ollama-1.0")
                    .generatedAt(LocalDateTime.now())
                    .build());
            }

            // If pattern doesn't match, try to extract value from response
            String cleanResponse = response.trim();
            if (!cleanResponse.isEmpty() && cleanResponse.length() < 100) {
                return Optional.of(SuggestionResponse.builder()
                    .anomalyId(anomaly.getId())
                    .suggestedValue(cleanResponse)
                    .confidence(0.5)
                    .confidenceLevel(ConfidenceLevel.MEDIUM)
                    .source(SuggestionSource.LLM_FALLBACK)
                    .explanation("Suggestion generee par LLM")
                    .modelVersion("ollama-1.0")
                    .generatedAt(LocalDateTime.now())
                    .build());
            }

        } catch (Exception e) {
            log.debug("Failed to parse LLM suggestion response: {}", e.getMessage());
        }

        return Optional.empty();
    }

    /**
     * Call Ollama with rate limiting.
     */
    private Optional<String> callOllama(String prompt) {
        if (!llmSemaphore.tryAcquire()) {
            log.debug("Ollama semaphore full, skipping request");
            return Optional.empty();
        }

        try {
            long start = System.currentTimeMillis();

            String answer = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(prompt)
                .call()
                .content();

            long duration = System.currentTimeMillis() - start;
            log.debug("Ollama response in {}ms", duration);

            return Optional.ofNullable(answer);

        } catch (Exception e) {
            log.warn("Ollama call failed: {}", e.getMessage());
            return Optional.empty();
        } finally {
            llmSemaphore.release();
        }
    }
}
