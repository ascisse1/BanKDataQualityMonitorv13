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
            Faro, esprit de clarte et de verite dans la mythologie Bambara.
            Tu reponds toujours en francais, de maniere precise et concise.

            REGLES STRICTES:
            1. Les sections [CLIENTS], [ANOMALIES], [TICKETS], etc. ci-dessous contiennent les chiffres REELS et A JOUR du systeme bancaire.
            2. Quand on te demande un chiffre, tu DOIS repondre UNIQUEMENT avec les valeurs fournies dans ces sections.
            3. NE JAMAIS inventer de chiffres. NE JAMAIS generer de SQL. NE JAMAIS dire "je vais utiliser la fonction...".
            4. Si une information n'est pas dans les donnees fournies, dis "Cette information n'est pas disponible dans les donnees actuelles."
            5. Reponds directement avec le chiffre demande, par exemple: "Il y a actuellement 1234 anomalies au total."
            """;

    @Bean
    ChatClient faroChat(ChatClient.Builder builder) {
        return builder
                .defaultSystem(SYSTEM_PROMPT)
                .build();
    }
}
