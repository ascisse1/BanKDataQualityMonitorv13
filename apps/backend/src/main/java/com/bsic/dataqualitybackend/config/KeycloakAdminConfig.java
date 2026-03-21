package com.bsic.dataqualitybackend.config;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jboss.resteasy.client.jaxrs.internal.ResteasyClientBuilderImpl;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.concurrent.TimeUnit;

/**
 * Configuration for Keycloak Admin Client.
 * Provides access to Keycloak Admin API for user and group management.
 */
@Slf4j
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "keycloak")
public class KeycloakAdminConfig {

    private String authServerUrl;
    private String realm;
    private String resource;
    private String adminClientId;
    private String adminClientSecret;
    private String agencyCodeClaim = "agency_code";

    private Keycloak keycloakInstance;

    @PostConstruct
    public void init() {
        log.info("Initializing Keycloak Admin Client for realm: {}", realm);
    }

    @PreDestroy
    public void cleanup() {
        if (keycloakInstance != null) {
            log.info("Closing Keycloak Admin Client connection");
            keycloakInstance.close();
        }
    }

    /**
     * Gets or creates a Keycloak admin client instance.
     * Uses client credentials flow for authentication.
     *
     * @return Keycloak admin client instance.
     */
    public synchronized Keycloak getInstance() {
        if (keycloakInstance == null || keycloakInstance.isClosed()) {
            keycloakInstance = createKeycloakInstance();
        }
        return keycloakInstance;
    }

    /**
     * Creates a new Keycloak admin client instance.
     */
    private Keycloak createKeycloakInstance() {
        log.debug("Creating new Keycloak instance: serverUrl={}, realm={}, clientId={}",
                authServerUrl, realm, adminClientId);

        return KeycloakBuilder.builder()
                .serverUrl(authServerUrl)
                .realm(realm)
                .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                .clientId(adminClientId != null ? adminClientId : resource)
                .clientSecret(adminClientSecret)
                .resteasyClient(new ResteasyClientBuilderImpl()
                        .connectTimeout(10, TimeUnit.SECONDS)
                        .readTimeout(30, TimeUnit.SECONDS)
                        .build())
                .build();
    }

    /**
     * Gets the realm resource for the configured realm.
     *
     * @return RealmResource for admin operations.
     */
    public RealmResource getRealmResource() {
        return getInstance().realm(realm);
    }

    /**
     * Gets the users resource for the configured realm.
     *
     * @return UsersResource for user management.
     */
    public UsersResource getUsersResource() {
        return getRealmResource().users();
    }

    /**
     * Refreshes the Keycloak admin client connection.
     * Useful if the token has expired.
     */
    public synchronized void refreshConnection() {
        if (keycloakInstance != null) {
            keycloakInstance.close();
        }
        keycloakInstance = createKeycloakInstance();
        log.info("Keycloak Admin Client connection refreshed");
    }
}
