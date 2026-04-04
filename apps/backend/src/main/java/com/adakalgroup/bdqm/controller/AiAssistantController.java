package com.adakalgroup.bdqm.controller;

import com.adakalgroup.bdqm.dto.AnomalyDto;
import com.adakalgroup.bdqm.dto.ApiResponse;
import com.adakalgroup.bdqm.dto.ai.AiRequest;
import com.adakalgroup.bdqm.dto.ai.AiResponse;
import com.adakalgroup.bdqm.service.AiAssistantService;
import com.adakalgroup.bdqm.service.AiAssistantService.ChatMsg;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.faro.enabled", havingValue = "true")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        boolean serverReachable = aiAssistantService.isServerReachable();
        boolean modelReady = serverReachable && aiAssistantService.isModelReady();
        String faroStatus;
        if (modelReady) {
            faroStatus = "ready";
        } else if (serverReachable) {
            faroStatus = "downloading";
        } else {
            faroStatus = "offline";
        }
        Map<String, Object> status = Map.of(
                "enabled", true,
                "serverReachable", serverReachable,
                "modelReady", modelReady,
                "available", modelReady,
                "status", faroStatus
        );
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @PostMapping("/explain-anomaly")
    public ResponseEntity<ApiResponse<AiResponse>> explainAnomaly(@RequestBody AnomalyDto anomaly) {
        log.info("Faro explain anomaly for client {}, field {}", anomaly.getClientNumber(), anomaly.getFieldName());
        AiResponse response = aiAssistantService.explainAnomaly(anomaly);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/suggest-correction")
    public ResponseEntity<ApiResponse<AiResponse>> suggestCorrection(@RequestBody AnomalyDto anomaly) {
        log.info("Faro suggest correction for client {}, field {}", anomaly.getClientNumber(), anomaly.getFieldName());
        AiResponse response = aiAssistantService.suggestCorrection(anomaly);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/report-narrative")
    public ResponseEntity<ApiResponse<AiResponse>> generateReportNarrative(@RequestBody Map<String, Object> stats) {
        log.info("Faro report narrative with {} stats", stats.size());
        AiResponse response = aiAssistantService.generateReportNarrative(stats);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/analyze-patterns")
    public ResponseEntity<ApiResponse<AiResponse>> analyzePatterns(@RequestBody List<AnomalyDto> anomalies) {
        log.info("Faro analyze patterns with {} anomalies", anomalies.size());
        AiResponse response = aiAssistantService.analyzeAnomalyPatterns(anomalies);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<AiResponse>> ask(@RequestBody AiRequest request) {
        log.info("Faro question: {}", request.getQuestion());
        AiResponse response = aiAssistantService.askQuestion(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiResponse>> chat(@RequestBody ChatRequest request) {
        log.info("Faro chat with {} history messages", request.getHistory().size());
        AiResponse response = aiAssistantService.chat(
                request.getHistory().stream()
                        .map(m -> new ChatMsg(m.getRole(), m.getContent()))
                        .toList(),
                request.getMessage()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Data
    public static class ChatRequest {
        private String message;
        private List<ChatMsgDto> history = List.of();

        @Data
        public static class ChatMsgDto {
            private String role;
            private String content;
        }
    }
}
