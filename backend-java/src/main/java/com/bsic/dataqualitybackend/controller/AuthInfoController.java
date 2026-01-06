package com.bsic.dataqualitybackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Provides authentication configuration info to the frontend.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthInfoController {

    @Value("${spring.security.oauth2.client.provider.keycloak.issuer-uri:}")
    private String issuerUri;

    @Value("${spring.security.oauth2.client.registration.keycloak.client-id:}")
    private String clientId;

    /**
     * Returns Keycloak configuration for frontend initialization.
     * This endpoint is public (no authentication required).
     */
    @GetMapping("/auth-info")
    public Map<String, String> getAuthInfo() {
        return Map.of(
                "issuer", issuerUri,
                "clientId", clientId
        );
    }
}
