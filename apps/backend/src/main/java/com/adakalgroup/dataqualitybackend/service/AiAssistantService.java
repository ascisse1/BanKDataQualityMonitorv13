package com.adakalgroup.dataqualitybackend.service;

import com.adakalgroup.dataqualitybackend.dto.AnomalyDto;
import com.adakalgroup.dataqualitybackend.dto.ai.AiRequest;
import com.adakalgroup.dataqualitybackend.dto.ai.AiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Faro AI assistant service powered by Spring AI.
 * Uses ChatClient with function calling — the LLM queries data on demand via tools.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.faro.enabled", havingValue = "true")
public class AiAssistantService {

    private final ChatClient faroChat;
    private final RestTemplate restTemplate;
    private final String ollamaBaseUrl;

    public AiAssistantService(ChatClient faroChat,
                              RestTemplate restTemplate,
                              @org.springframework.beans.factory.annotation.Value("${spring.ai.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl) {
        this.faroChat = faroChat;
        this.restTemplate = restTemplate;
        this.ollamaBaseUrl = ollamaBaseUrl;
        log.info("Faro AI Service initialized with Spring AI (Ollama at {})", ollamaBaseUrl);
    }

    /**
     * Explain a single anomaly in natural language.
     */
    public AiResponse explainAnomaly(AnomalyDto anomaly) {
        String userPrompt = String.format("""
                Explique cette anomalie detectee sur un client bancaire:

                - Client: %s (N° %s, type: %s)
                - Agence: %s
                - Champ concerne: %s (%s)
                - Valeur actuelle: "%s"
                - Type d'erreur: %s
                - Message: %s
                - Severite: %s

                Donne:
                1. Une explication claire du probleme
                2. L'impact potentiel sur les operations bancaires
                3. La correction recommandee
                """,
                anomaly.getClientName(),
                anomaly.getClientNumber(),
                anomaly.getClientType(),
                anomaly.getStructureName(),
                anomaly.getFieldName(),
                anomaly.getFieldLabel() != null ? anomaly.getFieldLabel() : "N/A",
                anomaly.getCurrentValue(),
                anomaly.getErrorType(),
                anomaly.getErrorMessage(),
                anomaly.getSeverity()
        );

        return callFaro(userPrompt);
    }

    /**
     * Suggest a correction value for an anomaly.
     */
    public AiResponse suggestCorrection(AnomalyDto anomaly) {
        String userPrompt = String.format("""
                Pour cette anomalie bancaire, propose la valeur corrigee la plus probable:

                - Champ: %s (%s)
                - Valeur actuelle: "%s"
                - Valeur attendue: "%s"
                - Type d'erreur: %s
                - Message: %s
                - Type client: %s

                Reponds avec:
                1. La valeur corrigee proposee
                2. Le niveau de confiance (HAUTE, MOYENNE, BASSE)
                3. La justification en une phrase

                Format: VALEUR: [valeur] | CONFIANCE: [niveau] | RAISON: [justification]
                """,
                anomaly.getFieldName(),
                anomaly.getFieldLabel() != null ? anomaly.getFieldLabel() : "N/A",
                anomaly.getCurrentValue(),
                anomaly.getExpectedValue() != null ? anomaly.getExpectedValue() : "non specifie",
                anomaly.getErrorType(),
                anomaly.getErrorMessage(),
                anomaly.getClientType()
        );

        return callFaro(userPrompt);
    }

    /**
     * Generate a narrative report from KPI/statistics data.
     */
    public AiResponse generateReportNarrative(Map<String, Object> stats) {
        String statsText = stats.entrySet().stream()
                .map(e -> "- " + e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining("\n"));

        String userPrompt = String.format("""
                Genere un resume executif en francais a partir de ces statistiques de qualite des donnees bancaires:

                %s

                Le resume doit:
                1. Commencer par l'etat general de la qualite des donnees
                2. Identifier les points d'attention prioritaires
                3. Mentionner les progres realises
                4. Recommander les prochaines actions

                Format professionnel, 3-5 paragraphes maximum.
                """, statsText);

        return callFaro(userPrompt);
    }

    /**
     * Analyze a batch of anomalies and identify patterns.
     */
    public AiResponse analyzeAnomalyPatterns(List<AnomalyDto> anomalies) {
        String anomalySummary = anomalies.stream()
                .limit(50)
                .map(a -> String.format("  [%s] %s=%s (%s) - %s",
                        a.getClientType(), a.getFieldName(), a.getCurrentValue(),
                        a.getErrorType(), a.getErrorMessage()))
                .collect(Collectors.joining("\n"));

        String userPrompt = String.format("""
                Analyse ces %d anomalies bancaires et identifie les tendances:

                %s

                Fournis:
                1. Les patterns recurrents (champs les plus touches, types d'erreurs frequents)
                2. Les causes probables
                3. Les recommandations pour reduire ces anomalies a la source
                4. Les priorites de correction
                """, anomalies.size(), anomalySummary);

        return callFaro(userPrompt);
    }

    /**
     * Free-form question about data quality.
     */
    public AiResponse askQuestion(AiRequest request) {
        StringBuilder prompt = new StringBuilder(request.getQuestion());
        String ctx = buildContext(request);
        if (!ctx.isEmpty()) {
            prompt.append("\n\nContexte:\n").append(ctx);
        }
        return callFaro(prompt.toString());
    }

    /**
     * Chat with conversation history — Spring AI handles function calling automatically.
     */
    public AiResponse chat(List<ChatMsg> history, String newMessage) {
        long start = System.currentTimeMillis();

        List<Message> messages = new ArrayList<>();
        for (ChatMsg msg : history) {
            if ("user".equals(msg.role())) {
                messages.add(new UserMessage(msg.content()));
            } else {
                messages.add(new AssistantMessage(msg.content()));
            }
        }
        messages.add(new UserMessage(newMessage));

        try {
            ChatResponse response = faroChat.prompt(new Prompt(messages))
                    .call()
                    .chatResponse();

            long duration = System.currentTimeMillis() - start;
            String answer = response.getResult().getOutput().getText();
            String model = response.getMetadata() != null ? response.getMetadata().getModel() : "mistral";

            log.info("Faro chat response in {}ms", duration);
            return AiResponse.of(answer, model, duration);

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("Faro chat failed: {}", e.getMessage(), e);
            return AiResponse.of("Erreur de communication avec Faro: " + e.getMessage(), "none", duration);
        }
    }

    // --- Status checks ---

    public boolean isAvailable() {
        return isServerReachable() && isModelReady();
    }

    public boolean isServerReachable() {
        try {
            restTemplate.getForObject(ollamaBaseUrl + "/api/tags", String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isModelReady() {
        try {
            var response = restTemplate.getForObject(ollamaBaseUrl + "/api/tags", Map.class);
            if (response == null || response.get("models") == null) return false;
            var models = (List<Map<String, Object>>) response.get("models");
            return models.stream().anyMatch(m -> {
                String name = (String) m.get("name");
                return name != null && (name.startsWith("mistral") || name.contains("mistral"));
            });
        } catch (Exception e) {
            return false;
        }
    }

    // --- Private helpers ---

    private AiResponse callFaro(String userPrompt) {
        long start = System.currentTimeMillis();
        try {
            String answer = faroChat.prompt()
                    .user(userPrompt)
                    .call()
                    .content();

            long duration = System.currentTimeMillis() - start;
            log.info("Faro response in {}ms ({} chars)", duration, answer != null ? answer.length() : 0);
            return AiResponse.of(answer, "mistral", duration);

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("Faro call failed: {}", e.getMessage(), e);
            return AiResponse.of("Erreur de communication avec Faro: " + e.getMessage(), "none", duration);
        }
    }

    private String buildContext(AiRequest request) {
        StringBuilder ctx = new StringBuilder();
        if (request.getClientNumber() != null) {
            ctx.append("- Client: ").append(request.getClientNumber()).append("\n");
        }
        if (request.getFieldName() != null) {
            ctx.append("- Champ: ").append(request.getFieldName()).append("\n");
        }
        if (request.getCurrentValue() != null) {
            ctx.append("- Valeur actuelle: ").append(request.getCurrentValue()).append("\n");
        }
        if (request.getErrorMessage() != null) {
            ctx.append("- Erreur: ").append(request.getErrorMessage()).append("\n");
        }
        if (request.getStructureCode() != null) {
            ctx.append("- Agence: ").append(request.getStructureCode()).append("\n");
        }
        return ctx.toString();
    }

    /** Simple record for chat messages from the frontend */
    public record ChatMsg(String role, String content) {}
}
