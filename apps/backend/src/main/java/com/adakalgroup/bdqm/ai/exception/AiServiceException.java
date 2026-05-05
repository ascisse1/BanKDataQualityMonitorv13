package com.adakalgroup.bdqm.ai.exception;

/**
 * Exception thrown when AI service operations fail.
 */
public class AiServiceException extends RuntimeException {

    private final String errorCode;
    private final boolean retryable;

    public AiServiceException(String message) {
        super(message);
        this.errorCode = "AI_SERVICE_ERROR";
        this.retryable = true;
    }

    public AiServiceException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.retryable = true;
    }

    public AiServiceException(String message, String errorCode, boolean retryable) {
        super(message);
        this.errorCode = errorCode;
        this.retryable = retryable;
    }

    public AiServiceException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "AI_SERVICE_ERROR";
        this.retryable = true;
    }

    public AiServiceException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.retryable = true;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public boolean isRetryable() {
        return retryable;
    }

    // Common error codes
    public static AiServiceException unavailable(String details) {
        return new AiServiceException(
            "AI service is not available: " + details,
            "AI_SERVICE_UNAVAILABLE"
        );
    }

    public static AiServiceException timeout(String operation) {
        return new AiServiceException(
            "AI service timeout during: " + operation,
            "AI_SERVICE_TIMEOUT"
        );
    }

    public static AiServiceException modelError(String modelName, String details) {
        return new AiServiceException(
            "Model error in " + modelName + ": " + details,
            "AI_MODEL_ERROR",
            false
        );
    }

    public static AiServiceException invalidRequest(String details) {
        return new AiServiceException(
            "Invalid AI request: " + details,
            "AI_INVALID_REQUEST",
            false
        );
    }
}
