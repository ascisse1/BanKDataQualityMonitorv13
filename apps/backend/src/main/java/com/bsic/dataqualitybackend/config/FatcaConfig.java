package com.bsic.dataqualitybackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.fatca")
public class FatcaConfig {

    /**
     * Global Intermediary Identification Number (GIIN) assigned by the IRS.
     * Format: XXXXXX.XXXXX.XX.XXX
     */
    private String giin = "XXXXXX.XXXXX.XX.XXX";

    /**
     * ISO country code for the reporting Financial Institution.
     */
    private String reportingCountry = "BJ";

    /**
     * Name of the reporting Financial Institution.
     */
    private String fiName = "BSIC Bénin";

    /**
     * Address of the reporting Financial Institution.
     */
    private String fiAddress = "Avenue Jean-Paul II, Cotonou, Bénin";

    /**
     * FATCA filer category (e.g. FATCA601, FATCA602, etc.)
     */
    private String filerCategory = "FATCA601";

    /**
     * Whether automated FATCA screening is enabled.
     */
    private boolean screeningEnabled = true;
}
