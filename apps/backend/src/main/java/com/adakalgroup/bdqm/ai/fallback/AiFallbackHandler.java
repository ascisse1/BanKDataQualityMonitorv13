package com.adakalgroup.bdqm.ai.fallback;

import com.adakalgroup.bdqm.ai.exception.AiServiceException;
import lombok.extern.slf4j.Slf4j;

import java.util.function.Supplier;

/**
 * Handles graceful degradation when AI service is unavailable.
 */
@Slf4j
public class AiFallbackHandler {

    private final boolean fallbackOnError;

    public AiFallbackHandler(boolean fallbackOnError) {
        this.fallbackOnError = fallbackOnError;
    }

    /**
     * Execute an AI operation with fallback support.
     *
     * @param aiCall       The primary AI operation
     * @param fallback     The fallback operation if AI fails
     * @param operationName Name of the operation for logging
     * @param <T>          Return type
     * @return Result from AI call or fallback
     */
    public <T> T executeWithFallback(Supplier<T> aiCall,
                                      Supplier<T> fallback,
                                      String operationName) {
        try {
            return aiCall.get();
        } catch (AiServiceException e) {
            if (fallbackOnError) {
                log.warn("AI {} failed, using fallback: {}", operationName, e.getMessage());
                return fallback.get();
            }
            throw e;
        } catch (Exception e) {
            if (fallbackOnError) {
                log.warn("AI {} failed unexpectedly, using fallback: {}",
                    operationName, e.getMessage());
                return fallback.get();
            }
            throw new AiServiceException("AI operation failed: " + operationName, e);
        }
    }

    /**
     * Execute an AI operation with null as fallback.
     */
    public <T> T executeWithNullFallback(Supplier<T> aiCall, String operationName) {
        return executeWithFallback(aiCall, () -> null, operationName);
    }

    /**
     * Execute an AI operation, silently ignoring failures.
     */
    public void executeQuietly(Runnable aiCall, String operationName) {
        try {
            aiCall.run();
        } catch (Exception e) {
            if (fallbackOnError) {
                log.warn("AI {} failed (ignored): {}", operationName, e.getMessage());
            } else {
                throw new AiServiceException("AI operation failed: " + operationName, e);
            }
        }
    }

    /**
     * Check if fallback mode is enabled.
     */
    public boolean isFallbackEnabled() {
        return fallbackOnError;
    }
}
