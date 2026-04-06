package com.adakalgroup.bdqm.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Manages SSE connections for real-time sync progress tracking.
 * Clients subscribe via GET /api/sync/progress and receive batch-level updates.
 */
@Service
@Slf4j
public class SyncProgressService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(600_000L); // 10 min timeout
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        log.info("SSE client subscribed for sync progress ({} active)", emitters.size());
        return emitter;
    }

    public void emitBatchProgress(String tableName, int offset, int batchSize, long totalCount,
                                   int upserted, int anomalies, long batchDurationMs) {
        double progress = totalCount > 0 ? Math.min(100.0, ((offset + batchSize) * 100.0) / totalCount) : 100.0;

        Map<String, Object> event = Map.of(
                "type", "BATCH",
                "table", tableName,
                "offset", offset,
                "batchSize", batchSize,
                "totalCount", totalCount,
                "upserted", upserted,
                "anomalies", anomalies,
                "batchDurationMs", batchDurationMs,
                "progress", Math.round(progress * 10.0) / 10.0
        );
        broadcast(event);
    }

    public void emitTableComplete(String tableName, int totalUpserted, int totalAnomalies,
                                   int errors, long durationMs, boolean cdc) {
        Map<String, Object> event = Map.of(
                "type", "TABLE_COMPLETE",
                "table", tableName,
                "upserted", totalUpserted,
                "anomalies", totalAnomalies,
                "errors", errors,
                "durationMs", durationMs,
                "cdc", cdc
        );
        broadcast(event);
    }

    public void emitSyncComplete(int tablesProcessed, long totalDurationMs) {
        Map<String, Object> event = Map.of(
                "type", "SYNC_COMPLETE",
                "tablesProcessed", tablesProcessed,
                "durationMs", totalDurationMs
        );
        broadcast(event);
    }

    private void broadcast(Map<String, Object> data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().data(data));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}
