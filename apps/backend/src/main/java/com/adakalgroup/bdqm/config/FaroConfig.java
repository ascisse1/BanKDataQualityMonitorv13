package com.adakalgroup.bdqm.config;

import com.adakalgroup.bdqm.service.FaroDataContextService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.model.ollama.autoconfigure.OllamaApiAutoConfiguration;
import org.springframework.ai.model.ollama.autoconfigure.OllamaChatAutoConfiguration;
import org.springframework.ai.model.ollama.autoconfigure.OllamaEmbeddingAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * Faro AI configuration — builds the ChatClient with system prompt + live data context.
 * Data is injected directly into the prompt (no tool calling needed for Mistral 7B).
 */
@Configuration
@ConditionalOnProperty(name = "app.faro.enabled", havingValue = "true")
@Import({
    OllamaApiAutoConfiguration.class,
    OllamaChatAutoConfiguration.class,
    OllamaEmbeddingAutoConfiguration.class
})
public class FaroConfig {

    public static final String SYSTEM_PROMPT = """
            Tu es Faro, l'assistant IA expert en qualite des donnees bancaires.
            Faro, esprit de clarte et de verite dans la mythologie Bambara, guide les utilisateurs
            dans l'analyse des anomalies du systeme d'information bancaire (CBS Amplitude/Informix).
            Tu reponds toujours en francais, de maniere precise et concise.

            IMPORTANT: Les donnees ci-dessous sont les chiffres REELS du systeme, mis a jour automatiquement.
            Utilise TOUJOURS ces chiffres pour repondre aux questions quantitatives.
            Ne devine jamais. Ne genere pas de SQL. Cite les chiffres exacts tels que fournis.
            """;

    @Bean
    ChatClient faroChat(ChatClient.Builder builder) {
        return builder
                .defaultSystem(SYSTEM_PROMPT)
                .build();
    }
}
