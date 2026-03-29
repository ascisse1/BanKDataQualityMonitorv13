package com.bsic.dataqualitybackend.config;

import lombok.extern.slf4j.Slf4j;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration pour le client administrateur Keycloak
 */
@Slf4j
@Configuration
public class KeycloakConfiguration {

    @Value("${app.keycloak.server-url:http://localhost:9080}")
    private String keycloakServerUrl;

    @Value("${app.keycloak.realm:jhipster}")
    private String keycloakTargetRealm;

    @Value("${app.keycloak.client-id:admin-cli}")
    private String keycloakAdminClientId;

    @Value("${app.keycloak.client-secret}")
    private String keycloakAdminClientSecret;

    /**
     * Configuration du client administrateur Keycloak
     * <p>
     * Ce bean est utilisé pour les opérations d'administration comme  – Création et gestion des utilisateurs
     * - Gestion des rôles et groupes
     * - Migrations automatiques.
     * <p>
     * Utilise-le flow client credentials pour une sécurité renforcée
     */
    @Bean
    public Keycloak keycloak() {
        log.info("Configuration du client Keycloak Admin avec client credentials");
        log.debug("Keycloak Server URL: {}", keycloakServerUrl);
        log.debug("Target Realm: {}", keycloakTargetRealm);
        log.debug("Admin Client ID: {}", keycloakAdminClientId);

        try {
            return KeycloakBuilder.builder()
                .serverUrl(keycloakServerUrl)
                .realm(keycloakTargetRealm)
                .clientId(keycloakAdminClientId)
                .clientSecret(keycloakAdminClientSecret)
                .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                .build();
        } catch (Exception e) {
            log.error("Erreur lors de la configuration du client Keycloak", e);
            throw new RuntimeException("Impossible de configurer le client Keycloak", e);
        }
    }
}
