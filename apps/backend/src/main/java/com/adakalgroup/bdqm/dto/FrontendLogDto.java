package com.adakalgroup.bdqm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for receiving frontend logs from the monitoring service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FrontendLogDto {

    private String sessionId;
    private String environment;
    private List<LogEntry> logs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogEntry {
        private String timestamp;
        private String level;
        private String category;
        private String message;
        private Map<String, Object> details;
        private String userId;
        private String sessionId;
        private String path;
        private String userAgent;
        private String stack;
    }
}
