package com.adakalgroup.bdqm.ai.config;

import com.adakalgroup.bdqm.ai.client.AiDetectionClient;
import com.adakalgroup.bdqm.ai.fallback.AiFallbackHandler;
import com.adakalgroup.bdqm.ai.repository.AiRiskScoreRepository;
import com.adakalgroup.bdqm.ai.repository.AiSuggestionRepository;
import com.adakalgroup.bdqm.ai.service.AiDetectionService;
import com.adakalgroup.bdqm.ai.service.CorrectionSuggestionService;
import com.adakalgroup.bdqm.ai.service.OllamaService;
import com.adakalgroup.bdqm.ai.service.RiskScoringService;
import com.adakalgroup.bdqm.repository.AnomalyRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Spring configuration for the AI Detection module.
 * All beans are conditional on the ai-detection.enabled property.
 * When disabled, no AI-related beans are created.
 */
@Configuration
@ConditionalOnProperty(
    name = "app.features.ai-detection.enabled",
    havingValue = "true"
)
public class AiDetectionConfig {

    /**
     * RestTemplate configured for AI service communication.
     */
    @Bean
    public RestTemplate aiRestTemplate(AiServiceProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.getTimeoutMs());
        factory.setReadTimeout(props.getTimeoutMs());
        return new RestTemplate(factory);
    }

    /**
     * HTTP client for communicating with the Python ML service.
     */
    @Bean
    public AiDetectionClient aiDetectionClient(RestTemplate aiRestTemplate,
                                                AiServiceProperties props) {
        return new AiDetectionClient(aiRestTemplate, props);
    }

    /**
     * Fallback handler for graceful degradation when AI service is unavailable.
     */
    @Bean
    public AiFallbackHandler aiFallbackHandler(AiServiceProperties props) {
        return new AiFallbackHandler(props.isFallbackOnError());
    }

    /**
     * Main AI Detection service orchestrating all AI features.
     */
    @Bean
    public AiDetectionService aiDetectionService(AiDetectionClient client,
                                                  AiFallbackHandler fallbackHandler,
                                                  AnomalyRepository anomalyRepository,
                                                  AiRiskScoreRepository riskScoreRepository,
                                                  AiSuggestionRepository suggestionRepository,
                                                  AiDetectionProperties props,
                                                  OllamaService ollamaService) {
        return new AiDetectionService(
            client,
            fallbackHandler,
            anomalyRepository,
            riskScoreRepository,
            suggestionRepository,
            props,
            ollamaService
        );
    }

    /**
     * Risk scoring service - only created if risk-scoring is enabled.
     */
    @Bean
    @ConditionalOnProperty(
        name = "app.features.ai-detection.risk-scoring",
        havingValue = "true",
        matchIfMissing = true
    )
    public RiskScoringService riskScoringService(AiDetectionClient client,
                                                  AiFallbackHandler fallbackHandler,
                                                  AiRiskScoreRepository repository) {
        return new RiskScoringService(client, fallbackHandler, repository);
    }

    /**
     * Correction suggestion service - only created if correction-suggestions is enabled.
     */
    @Bean
    @ConditionalOnProperty(
        name = "app.features.ai-detection.correction-suggestions",
        havingValue = "true",
        matchIfMissing = true
    )
    public CorrectionSuggestionService correctionSuggestionService(AiDetectionClient client,
                                                                    AiFallbackHandler fallbackHandler,
                                                                    AiSuggestionRepository repository) {
        return new CorrectionSuggestionService(client, fallbackHandler, repository);
    }
}
