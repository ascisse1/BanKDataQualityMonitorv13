package com.adakalgroup.bdqm.config;

import com.adakalgroup.bdqm.service.keycloak.KeycloakMigrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

/**
 * Listener qui exécute les migrations Keycloak au démarrage de l'application
 */
@Slf4j
@Component
public class KeycloakMigrationListener implements ApplicationListener<ContextRefreshedEvent> {

    private final KeycloakMigrationService keycloakMigrationService;

    @Value("${application.keycloak.migration.enabled:true}")
    private boolean migrationEnabled;

    @Value("${application.keycloak.migration.async:true}")
    private boolean asyncMigration;

    @Value("${application.keycloak.migration.delay:5000}")
    private long migrationDelay;

    private boolean migrationExecuted = false;

    public KeycloakMigrationListener(KeycloakMigrationService keycloakMigrationService) {
        this.keycloakMigrationService = keycloakMigrationService;
    }

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        // S'assurer que la migration n'est exécutée qu'une seule fois
        if (migrationExecuted || !migrationEnabled) {
            return;
        }

        migrationExecuted = true;

        log.info("Application démarrée, préparation des migrations Keycloak...");
        log.info("Migration asynchrone: {}, Délai: {}ms", asyncMigration, migrationDelay);

        // Délai optionnel pour permettre à Keycloak de démarrer complètement
        if (migrationDelay > 0) {
            try {
                Thread.sleep(migrationDelay);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Interruption du délai de migration", e);
            }
        }

        try {
            if (asyncMigration) {
                // Exécution asynchrone des migrations
                keycloakMigrationService
                    .runMigrationsAsync()
                    .thenRun(() -> log.info("Migrations Keycloak asynchrones terminées"))
                    .exceptionally(throwable -> {
                        log.error("Erreur lors des migrations Keycloak asynchrones", throwable);
                        return null;
                    });
            } else {
                // Exécution synchrone des migrations
                keycloakMigrationService.runMigrations();
                log.info("Migrations Keycloak synchrones terminées");
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'initialisation des migrations Keycloak", e);
        }
    }
}
