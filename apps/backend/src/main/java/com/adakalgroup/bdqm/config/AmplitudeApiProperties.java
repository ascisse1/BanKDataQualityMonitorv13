package com.adakalgroup.bdqm.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for the Amplitude CBS REST API.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.amplitude-api")
public class AmplitudeApiProperties {

    /** Enable Amplitude API updates (vs direct JDBC) */
    private boolean enabled = false;

    /** Base URL of the Amplitude API (e.g., https://cbs-host/amplitude) */
    private String baseUrl = "http://localhost:8080/amplitude";

    /** API key / token for authentication */
    private String apiKey = "";

    /** Request timeout in milliseconds */
    private int timeout = 30000;

    /** API version (v1 or v2) */
    private String version = "v1";

    /** Fall back to JDBC if API call fails */
    private boolean fallbackJdbc = true;

    /** Technical user code sent in request headers */
    private String userCode = "BDQM";

    /** Channel code identifying the calling application */
    private String channelCode = "QUALITE";
}
