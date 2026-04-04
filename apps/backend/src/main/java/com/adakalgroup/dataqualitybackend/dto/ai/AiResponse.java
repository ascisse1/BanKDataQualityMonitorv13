package com.adakalgroup.dataqualitybackend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponse {

    private String answer;
    private String model;
    private long durationMs;

    public static AiResponse of(String answer, String model, long durationMs) {
        return AiResponse.builder()
                .answer(answer)
                .model(model)
                .durationMs(durationMs)
                .build();
    }

    public static AiResponse disabled() {
        return AiResponse.builder()
                .answer("Faro n'est pas active. Veuillez configurer app.ollama.enabled=true.")
                .model("none")
                .durationMs(0)
                .build();
    }
}
