package com.adakalgroup.bdqm.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.model.ollama.autoconfigure.OllamaApiAutoConfiguration;
import org.springframework.ai.model.ollama.autoconfigure.OllamaChatAutoConfiguration;
import org.springframework.ai.model.ollama.autoconfigure.OllamaEmbeddingAutoConfiguration;
import org.springframework.ai.support.ToolCallbacks;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * Faro AI configuration — builds the ChatClient with system prompt and tools.
 * Imports Ollama auto-configurations only when Faro is enabled.
 */
@Configuration
@ConditionalOnProperty(name = "app.faro.enabled", havingValue = "true")
@Import({
    OllamaApiAutoConfiguration.class,
    OllamaChatAutoConfiguration.class,
    OllamaEmbeddingAutoConfiguration.class
})
public class FaroConfig {

    @Bean
    ChatClient faroChat(ChatClient.Builder builder, FaroTools faroTools) {
        return builder
                .defaultSystem("""
                        Tu es Faro, l'assistant IA expert en qualite des donnees bancaires.
                        Faro, esprit de clarte et de verite dans la mythologie Bambara, guide les utilisateurs
                        dans l'analyse des anomalies du systeme d'information bancaire (CBS Amplitude/Informix).
                        Tu reponds toujours en francais, de maniere precise et concise.

                        IMPORTANT: Quand l'utilisateur pose une question sur des chiffres ou des statistiques,
                        utilise TOUJOURS les outils disponibles pour obtenir les donnees reelles du systeme.
                        Ne devine jamais les chiffres. Cite toujours les donnees exactes.
                        """)
                .defaultToolCallbacks(ToolCallbacks.from(faroTools))
                .build();
    }
}
