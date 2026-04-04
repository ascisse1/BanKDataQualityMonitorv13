package com.adakalgroup.dataqualitybackend.service.keycloak;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RolesResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.GroupRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Service pour gérer les migrations automatiques Keycloak au démarrage
 */
@Slf4j
@Service
public class KeycloakMigrationService {
    private static final String MIGRATION_STATE_ATTRIBUTE = "migration_state";
    private static final String LAST_MIGRATION_DATE = "last_migration_date";
    private static final String ROLES_CHECKSUM_ATTRIBUTE = "roles_config_checksum";
    private static final String GROUPS_CHECKSUM_ATTRIBUTE = "groups_config_checksum";
    private static final String USERS_CHECKSUM_ATTRIBUTE = "users_config_checksum";

    private final Keycloak keycloak;
    private final String realmName;
    private final String clientName;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    public KeycloakMigrationService(
        Keycloak keycloak,
        @Value("${app.keycloak.realm}") String realmName,
        @Value("${app.client.name:default}") String clientName,
        ResourceLoader resourceLoader,
        ObjectMapper objectMapper
    ) {
        this.keycloak = keycloak;
        this.realmName = realmName;
        this.clientName = clientName.toLowerCase();
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;

        log.info("KeycloakMigrationService initialized for client: {} in realm: {}", clientName, realmName);
    }

    /**
     * Exécute toutes les migrations de manière asynchrone
     */
    @Async
    public CompletableFuture<Void> runMigrationsAsync() {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("Démarrage des migrations Keycloak pour le realm: {}", realmName);
                runMigrations();
                log.info("Migrations Keycloak terminées avec succès");
            } catch (Exception e) {
                log.error("Erreur lors des migrations Keycloak", e);
            }
        });
    }

    /**
     * Exécute toutes les migrations synchrone
     */
    public void runMigrations() {
        runMigrations(false);
    }

    /**
     * Exécute toutes les migrations synchrone avec option de forcer
     * @param force si true, ignore l'état des migrations précédentes
     */
    public void runMigrations(boolean force) {
        try {
            // First check if client-specific configurations exist
            if (!hasClientSpecificConfigurations()) {
                log.info("Skipping Keycloak migrations - no client-specific configuration found for client: {}", clientName);
                return;
            }

            RealmResource realm = getRealmResource();
            if (realm == null) {
                log.error("Impossible d'accéder au realm Keycloak: {}", realmName);
                return;
            }

            // Vérifier si les migrations sont nécessaires (sauf si forcé)
            if (!force && !isMigrationNeeded(realm)) {
                log.info("Aucune migration nécessaire pour le realm: {}", realmName);
                return;
            }

            if (force) {
                log.info("Migration forcée pour le realm: {}", realmName);
            }

            log.info("Exécution des migrations pour le realm: {} (client: {})", realmName, clientName);

            // Exécuter les migrations dans l'ordre
            migrateRoles(realm);
            migrateGroups(realm);
            migrateUsers(realm);

            // Marquer les migrations comme terminées
            markMigrationComplete(realm);

            log.info("Toutes les migrations ont été exécutées avec succès");
        } catch (Exception e) {
            log.error("Erreur lors de l'exécution des migrations", e);
            throw new RuntimeException("Migration failed", e);
        }
    }

    /**
     * Migrate les rôles depuis la configuration (common first, then client-specific)
     */
    private void migrateRoles(RealmResource realm) {
        log.info("Migration des rôles (common + client-specific) for client: {}...", clientName);
        try {
            RolesResource rolesResource = realm.roles();
            List<RoleConfig> roleConfigs = loadRoleConfigurations();

            for (RoleConfig roleConfig : roleConfigs) {
                // Vérifier si le rôle existe déjà
                try {
                    RoleRepresentation existingRole = rolesResource.get(roleConfig.getName()).toRepresentation();
                    log.debug("Rôle {} existe déjà", roleConfig.getName());

                    // Mettre à jour la description si nécessaire
                    if (!Objects.equals(existingRole.getDescription(), roleConfig.getDescription())) {
                        existingRole.setDescription(roleConfig.getDescription());
                        rolesResource.get(roleConfig.getName()).update(existingRole);
                        log.info("Mise à jour du rôle: {}", roleConfig.getName());
                    }
                } catch (Exception e) {
                    // Le rôle n'existe pas, le créer
                    RoleRepresentation role = new RoleRepresentation();
                    role.setName(roleConfig.getName());
                    role.setDescription(roleConfig.getDescription());
                    role.setClientRole(false);

                    rolesResource.create(role);
                    log.info("Création du rôle: {}", roleConfig.getName());
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors de la migration des rôles", e);
        }
    }

    /**
     * Migrate les groupes depuis la configuration (common first, then client-specific)
     */
    private void migrateGroups(RealmResource realm) {
        log.info("Migration des groupes (common + client-specific) for client: {}...", clientName);
        try {
            List<GroupConfig> groupConfigs = loadGroupConfigurations();

            for (GroupConfig groupConfig : groupConfigs) {
                createOrUpdateGroup(realm, groupConfig, null);
            }
        } catch (Exception e) {
            log.error("Erreur lors de la migration des groupes", e);
        }
    }

    /**
     * Créer ou mettre à jour un groupe
     */
    private void createOrUpdateGroup(RealmResource realm, GroupConfig groupConfig, GroupRepresentation parentGroup) {
        try {
            List<GroupRepresentation> existingGroups = getAllGroupsRecursive(realm);
            Optional<GroupRepresentation> existingGroup = existingGroups
                .stream()
                .filter(g -> g.getName().equals(groupConfig.getName()))
                .findFirst();

            GroupRepresentation group;
            if (existingGroup.isPresent()) {
                group = existingGroup.orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
                log.debug("Groupe {} existe déjà", groupConfig.getName());
            } else {
                group = new GroupRepresentation();
                group.setName(groupConfig.getName());
                group.setPath("/" + groupConfig.getName());

                if (parentGroup != null) {
                    realm.groups().group(parentGroup.getId()).subGroup(group);
                } else {
                    realm.groups().add(group);
                }

                // Récupérer l'ID du groupe créé
                List<GroupRepresentation> allGroups = getAllGroupsRecursive(realm);
                group = allGroups
                    .stream()
                    .filter(g -> g.getName().equals(groupConfig.getName()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Groupe créé non trouvé"));

                log.info("Création du groupe: {}", groupConfig.getName());
            }

            // Assigner les rôles au groupe
            if (groupConfig.getRoles() != null && !groupConfig.getRoles().isEmpty()) {
                assignRolesToGroup(realm, group, groupConfig.getRoles());
            }

            // Créer les sous-groupes
            if (groupConfig.getSubGroups() != null) {
                for (GroupConfig subGroupConfig : groupConfig.getSubGroups()) {
                    createOrUpdateGroup(realm, subGroupConfig, group);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors de la création/mise à jour du groupe: {}", groupConfig.getName(), e);
        }
    }

    /**
     * Assigner des rôles à un groupe
     */
    private void assignRolesToGroup(RealmResource realm, GroupRepresentation group, List<String> roleNames) {
        try {
            List<RoleRepresentation> rolesToAssign = roleNames
                .stream()
                .map(roleName -> {
                    try {
                        return realm.roles().get(roleName).toRepresentation();
                    } catch (Exception e) {
                        log.warn("Rôle {} non trouvé pour le groupe {}", roleName, group.getName());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            if (!rolesToAssign.isEmpty()) {
                realm.groups().group(group.getId()).roles().realmLevel().add(rolesToAssign);
                log.debug("Assignation de {} rôles au groupe {}", rolesToAssign.size(), group.getName());
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'assignation des rôles au groupe: {}", group.getName(), e);
        }
    }

    /**
     * Migrate les utilisateurs depuis la configuration (common first, then client-specific)
     */
    private void migrateUsers(RealmResource realm) {
        log.info("Migration des utilisateurs (common + client-specific) for client: {}...", clientName);
        try {
            UsersResource usersResource = realm.users();
            List<UserConfig> userConfigs = loadUserConfigurations();

            for (UserConfig userConfig : userConfigs) {
                createOrUpdateUser(realm, usersResource, userConfig);
            }
        } catch (Exception e) {
            log.error("Erreur lors de la migration des utilisateurs", e);
        }
    }

    /**
     * Créer ou mettre à jour un utilisateur
     */
    private void createOrUpdateUser(RealmResource realm, UsersResource usersResource, UserConfig userConfig) {
        try {
            List<UserRepresentation> existingUsers = usersResource.search(userConfig.getUsername());
            UserRepresentation user;

            if (!existingUsers.isEmpty()) {
                user = existingUsers.get(0);
                log.debug("Utilisateur {} existe déjà", userConfig.getUsername());

                // Mettre à jour les informations de base
                updateUserBasicInfo(user, userConfig);
                usersResource.get(user.getId()).update(user);
            } else {
                user = createNewUser(userConfig);
                usersResource.create(user);

                // Récupérer l'utilisateur créé avec son ID
                List<UserRepresentation> createdUsers = usersResource.search(userConfig.getUsername());
                if (!createdUsers.isEmpty()) {
                    user = createdUsers.get(0);
                    log.info("Création de l'utilisateur: {}", userConfig.getUsername());
                } else {
                    log.error("Impossible de récupérer l'utilisateur créé: {}", userConfig.getUsername());
                    return;
                }
            }

            // Définir le mot de passe
            if (userConfig.getPassword() != null && !userConfig.getPassword().isEmpty()) {
                setUserPassword(usersResource, user.getId(), userConfig.getPassword(), userConfig.isTemporary());
            }

            // Assigner les rôles
            if (userConfig.getRoles() != null && !userConfig.getRoles().isEmpty()) {
                assignRolesToUser(realm, user.getId(), userConfig.getRoles());
            }

            // Assigner aux groupes
            if (userConfig.getGroups() != null && !userConfig.getGroups().isEmpty()) {
                assignUserToGroups(realm, user.getId(), userConfig.getGroups());
            }
        } catch (Exception e) {
            log.error("Erreur lors de la création/mise à jour de l'utilisateur: {}", userConfig.getUsername(), e);
        }
    }

    /**
     * Mettre à jour les informations de base d'un utilisateur
     */
    private void updateUserBasicInfo(UserRepresentation user, UserConfig userConfig) {
        user.setFirstName(userConfig.getFirstName());
        user.setLastName(userConfig.getLastName());
        user.setEmail(userConfig.getEmail());
        user.setEnabled(userConfig.isEnabled());
        user.setEmailVerified(userConfig.isEmailVerified());
    }

    /**
     * Créer un nouvel utilisateur
     */
    private UserRepresentation createNewUser(UserConfig userConfig) {
        UserRepresentation user = new UserRepresentation();
        user.setUsername(userConfig.getUsername());
        user.setFirstName(userConfig.getFirstName());
        user.setLastName(userConfig.getLastName());
        user.setEmail(userConfig.getEmail());
        user.setEnabled(userConfig.isEnabled());
        user.setEmailVerified(userConfig.isEmailVerified());

        // Attributs personnalisés si nécessaire
        if (userConfig.getAttributes() != null) {
            user.setAttributes(userConfig.getAttributes());
        }

        return user;
    }

    /**
     * Définir le mot de passe d'un utilisateur
     */
    private void setUserPassword(UsersResource usersResource, String userId, String password, boolean temporary) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(temporary);

        usersResource.get(userId).resetPassword(credential);
        log.debug("Mot de passe défini pour l'utilisateur ID: {}", userId);
    }

    /**
     * Assigner des rôles à un utilisateur
     */
    private void assignRolesToUser(RealmResource realm, String userId, List<String> roleNames) {
        try {
            List<RoleRepresentation> rolesToAssign = roleNames
                .stream()
                .map(roleName -> {
                    try {
                        return realm.roles().get(roleName).toRepresentation();
                    } catch (Exception e) {
                        log.warn("Rôle {} non trouvé pour l'utilisateur ID: {}", roleName, userId);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            if (!rolesToAssign.isEmpty()) {
                realm.users().get(userId).roles().realmLevel().add(rolesToAssign);
                log.debug("Assignation de {} rôles à l'utilisateur ID: {}", rolesToAssign.size(), userId);
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'assignation des rôles à l'utilisateur ID: {}", userId, e);
        }
    }

    /**
     * Assigner un utilisateur à des groupes
     */
    private void assignUserToGroups(RealmResource realm, String userId, List<String> groupNames) {
        try {
            List<GroupRepresentation> allGroups = getAllGroupsRecursive(realm);

            for (String groupName : groupNames) {
                Optional<GroupRepresentation> group = allGroups.stream().filter(g -> g.getName().equals(groupName)).findFirst();

                if (group.isPresent()) {
                    realm.users().get(userId).joinGroup(group.orElseThrow(() -> new RuntimeException("Groupe non trouvé")).getId());
                    log.debug("Utilisateur ID: {} ajouté au groupe: {}", userId, groupName);
                } else {
                    log.warn("Groupe {} non trouvé pour l'utilisateur ID: {}", groupName, userId);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'assignation des groupes à l'utilisateur ID: {}", userId, e);
        }
    }

    /**
     * Vérifier si les migrations sont nécessaires en comparant les checksums des fichiers de configuration
     */
    private boolean isMigrationNeeded(RealmResource realm) {
        try {
            // First check if client-specific configurations exist
            if (!hasClientSpecificConfigurations()) {
                log.info("No client-specific configurations found - migration not needed for client: {}", clientName);
                return false;
            }

            Map<String, String> attributes = realm.toRepresentation().getAttributes();
            if (attributes == null) {
                log.info("Aucun attribut trouvé, première migration nécessaire");
                return true;
            }

            // Calculer les checksums actuels des fichiers de configuration client-spécifique
            String currentRolesChecksum = calculateClientConfigChecksum("roles", this::getDefaultRoleConfigurations);
            String currentGroupsChecksum = calculateClientConfigChecksum("groups", this::getDefaultGroupConfigurations);
            String currentUsersChecksum = calculateClientConfigChecksum("users", this::getDefaultUserConfigurations);

            // Récupérer les checksums stockés
            String storedRolesChecksum = attributes.get(ROLES_CHECKSUM_ATTRIBUTE);
            String storedGroupsChecksum = attributes.get(GROUPS_CHECKSUM_ATTRIBUTE);
            String storedUsersChecksum = attributes.get(USERS_CHECKSUM_ATTRIBUTE);

            // Vérifier si les checksums ont changé
            boolean rolesChanged = !Objects.equals(currentRolesChecksum, storedRolesChecksum);
            boolean groupsChanged = !Objects.equals(currentGroupsChecksum, storedGroupsChecksum);
            boolean usersChanged = !Objects.equals(currentUsersChecksum, storedUsersChecksum);

            if (rolesChanged) {
                log.info("Configuration des rôles modifiée (checksum: {} -> {})", storedRolesChecksum, currentRolesChecksum);
            }
            if (groupsChanged) {
                log.info("Configuration des groupes modifiée (checksum: {} -> {})", storedGroupsChecksum, currentGroupsChecksum);
            }
            if (usersChanged) {
                log.info("Configuration des utilisateurs modifiée (checksum: {} -> {})", storedUsersChecksum, currentUsersChecksum);
            }

            return rolesChanged || groupsChanged || usersChanged;
        } catch (Exception e) {
            log.warn("Impossible de vérifier les checksums des configurations, exécution par sécurité", e);
            return true;
        }
    }

    /**
     * Calculer le checksum combiné des configurations commune et client-spécifique
     */
    private String calculateClientConfigChecksum(String configType, java.util.function.Supplier<Object> defaultConfigSupplier) {
        try {
            StringBuilder combinedContent = new StringBuilder();

            // 1. Load common configuration content
            Resource commonResource = resourceLoader.getResource(getDefaultResourcePath(configType));
            if (commonResource.exists()) {
                String commonContent = new String(commonResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                combinedContent.append("COMMON:").append(commonContent);
                log.debug("Including common {} configuration in checksum", configType);
            } else {
                // Use default configuration if no common file
                Object defaultConfig = defaultConfigSupplier.get();
                String defaultContent = objectMapper.writeValueAsString(defaultConfig);
                combinedContent.append("DEFAULT:").append(defaultContent);
                log.debug("Including default {} configuration in checksum", configType);
            }

            // 2. Load client-specific configuration content
            Resource clientResource = resourceLoader.getResource(getClientSpecificResourcePath(configType));
            if (clientResource.exists()) {
                String clientContent = new String(clientResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                combinedContent.append("CLIENT:").append(clientContent);
                log.debug("Including client-specific {} configuration for {} in checksum", configType, clientName);
            }

            // 3. Calculate combined checksum
            String finalContent = combinedContent.toString();
            return calculateSHA256(finalContent);
        } catch (Exception e) {
            log.error("Erreur lors du calcul du checksum combiné pour {} (client: {})", configType, clientName, e);
            return "ERROR_" + System.currentTimeMillis();
        }
    }

    /**
     * Calculer le checksum d'un fichier de configuration ou utiliser la configuration par défaut (legacy)
     */
    @Deprecated
    private String calculateConfigChecksum(String resourcePath, java.util.function.Supplier<Object> defaultConfigSupplier) {
        try {
            Resource resource = resourceLoader.getResource(resourcePath);
            String content;

            if (resource.exists()) {
                // Lire le contenu du fichier
                content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                log.debug("Calcul du checksum pour le fichier: {}", resourcePath);
            } else {
                // Utiliser la configuration par défaut
                Object defaultConfig = defaultConfigSupplier.get();
                content = objectMapper.writeValueAsString(defaultConfig);
                log.debug("Calcul du checksum pour la configuration par défaut: {}", resourcePath);
            }

            return calculateSHA256(content);
        } catch (Exception e) {
            log.error("Erreur lors du calcul du checksum pour {}", resourcePath, e);
            return "ERROR_" + System.currentTimeMillis();
        }
    }

    /**
     * Calculer le hash SHA-256 d'une chaîne
     */
    private String calculateSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("Algorithme SHA-256 non disponible", e);
            return "NO_ALGORITHM_" + input.hashCode();
        }
    }

    /**
     * Obtenir l'état actuel des migrations
     */
    public String getMigrationState() {
        try {
            RealmResource realm = getRealmResource();
            if (realm == null) {
                return "REALM_INACCESSIBLE";
            }

            Map<String, String> attributes = realm.toRepresentation().getAttributes();
            if (attributes != null && attributes.containsKey(MIGRATION_STATE_ATTRIBUTE)) {
                String state = attributes.get(MIGRATION_STATE_ATTRIBUTE);
                String lastMigration = attributes.get(LAST_MIGRATION_DATE);
                String rolesChecksum = attributes.get(ROLES_CHECKSUM_ATTRIBUTE);
                String groupsChecksum = attributes.get(GROUPS_CHECKSUM_ATTRIBUTE);
                String usersChecksum = attributes.get(USERS_CHECKSUM_ATTRIBUTE);

                StringBuilder stateInfo = new StringBuilder();
                stateInfo.append(
                    String.format(
                        "État: %s, Dernière migration: %s%n",
                        state != null ? state : "NON_DÉFINI",
                        lastMigration != null ? lastMigration : "JAMAIS"
                    )
                );
                stateInfo.append("Checksums stockés:%n");
                stateInfo.append(String.format("  - Rôles: %s%n", rolesChecksum != null ? rolesChecksum : "NON_DÉFINI"));
                stateInfo.append(String.format("  - Groupes: %s%n", groupsChecksum != null ? groupsChecksum : "NON_DÉFINI"));
                stateInfo.append(String.format("  - Utilisateurs: %s", usersChecksum != null ? usersChecksum : "NON_DÉFINI"));

                return stateInfo.toString();
            }
            return "AUCUNE_MIGRATION_PRÉCÉDENTE";
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'état des migrations", e);
            return "ERREUR: " + e.getMessage();
        }
    }

    /**
     * Obtenir les checksums actuels des fichiers de configuration (pour debug)
     */
    public String getCurrentChecksums() {
        try {
            String rolesChecksum = calculateClientConfigChecksum("roles", this::getDefaultRoleConfigurations);
            String groupsChecksum = calculateClientConfigChecksum("groups", this::getDefaultGroupConfigurations);
            String usersChecksum = calculateClientConfigChecksum("users", this::getDefaultUserConfigurations);

            return String.format(
                "Checksums actuels (client: %s):%n  - Rôles: %s%n  - Groupes: %s%n  - Utilisateurs: %s",
                clientName,
                rolesChecksum,
                groupsChecksum,
                usersChecksum
            );
        } catch (Exception e) {
            log.error("Erreur lors du calcul des checksums actuels (client: {})", clientName, e);
            return "ERREUR: " + e.getMessage();
        }
    }

    /**
     * Réinitialiser l'état des migrations pour permettre une nouvelle exécution
     */
    public void resetMigrationState() {
        try {
            RealmResource realm = getRealmResource();
            if (realm == null) {
                log.error("Impossible d'accéder au realm Keycloak: {}", realmName);
                return;
            }

            var realmRepresentation = realm.toRepresentation();
            Map<String, String> attributes = realmRepresentation.getAttributes();
            if (attributes != null) {
                attributes.remove(MIGRATION_STATE_ATTRIBUTE);
                attributes.remove(LAST_MIGRATION_DATE);
                attributes.remove(ROLES_CHECKSUM_ATTRIBUTE);
                attributes.remove(GROUPS_CHECKSUM_ATTRIBUTE);
                attributes.remove(USERS_CHECKSUM_ATTRIBUTE);
                realmRepresentation.setAttributes(attributes);
                realm.update(realmRepresentation);
            }

            log.info("État des migrations réinitialisé pour le realm: {}", realmName);
        } catch (Exception e) {
            log.error("Erreur lors de la réinitialisation de l'état des migrations", e);
        }
    }

    /**
     * Marquer les migrations comme terminées et stocker les checksums des configurations
     */
    private void markMigrationComplete(RealmResource realm) {
        try {
            var realmRepresentation = realm.toRepresentation();
            Map<String, String> attributes = realmRepresentation.getAttributes();
            if (attributes == null) {
                attributes = new HashMap<>();
            }

            // Marquer la migration comme terminée
            attributes.put(MIGRATION_STATE_ATTRIBUTE, "completed");
            attributes.put(LAST_MIGRATION_DATE, Instant.now().toString());

            // Calculer et stocker les checksums actuels client-spécifique
            String rolesChecksum = calculateClientConfigChecksum("roles", this::getDefaultRoleConfigurations);
            String groupsChecksum = calculateClientConfigChecksum("groups", this::getDefaultGroupConfigurations);
            String usersChecksum = calculateClientConfigChecksum("users", this::getDefaultUserConfigurations);

            attributes.put(ROLES_CHECKSUM_ATTRIBUTE, rolesChecksum);
            attributes.put(GROUPS_CHECKSUM_ATTRIBUTE, groupsChecksum);
            attributes.put(USERS_CHECKSUM_ATTRIBUTE, usersChecksum);

            realmRepresentation.setAttributes(attributes);
            realm.update(realmRepresentation);

            log.info("Migrations marquées comme terminées dans le realm pour le client {} avec checksums:", clientName);
            log.info("  - Rôles: {}", rolesChecksum);
            log.info("  - Groupes: {}", groupsChecksum);
            log.info("  - Utilisateurs: {}", usersChecksum);
        } catch (Exception e) {
            log.error("Erreur lors du marquage des migrations comme terminées", e);
        }
    }

    /**
     * Obtenir la ressource du realm
     */
    private RealmResource getRealmResource() {
        try {
            return keycloak.realm(realmName);
        } catch (Exception e) {
            log.error("Erreur lors de l'accès au realm: {}", realmName, e);
            return null;
        }
    }

    /**
     * Récupérer tous les groupes de manière récursive (inclut les sous-groupes)
     */
    private List<GroupRepresentation> getAllGroupsRecursive(RealmResource realm) {
        List<GroupRepresentation> allGroups = new ArrayList<>();
        List<GroupRepresentation> topLevelGroups = realm.groups().groups();

        for (GroupRepresentation group : topLevelGroups) {
            allGroups.add(group);
            addSubGroupsRecursive(realm, allGroups, group);
        }

        return allGroups;
    }

    /**
     * Ajouter récursivement tous les sous-groupes à la liste
     */
    private void addSubGroupsRecursive(RealmResource realmResource, List<GroupRepresentation> allGroups, GroupRepresentation parentGroup) {
        if (parentGroup.getSubGroupCount() > 0) {
            var subGroups = realmResource.groups().group(parentGroup.getId()).getSubGroups(null, null, false);
            for (GroupRepresentation subGroup : subGroups) {
                allGroups.add(subGroup);
                addSubGroupsRecursive(realmResource, allGroups, subGroup);
            }
        }
    }

    /**
     * Get client-specific resource path
     */
    private String getClientSpecificResourcePath(String configType) {
        return String.format("classpath:config/keycloak/%s/%s.json", clientName, configType);
    }

    /**
     * Get default resource path
     */
    private String getDefaultResourcePath(String configType) {
        return String.format("classpath:config/keycloak/%s.json", configType);
    }

    /**
     * Check if client-specific configurations exist
     */
    private boolean hasClientSpecificConfigurations() {
        Resource rolesResource = resourceLoader.getResource(getClientSpecificResourcePath("roles"));
        Resource groupsResource = resourceLoader.getResource(getClientSpecificResourcePath("groups"));
        Resource usersResource = resourceLoader.getResource(getClientSpecificResourcePath("users"));

        boolean hasClientConfig = rolesResource.exists() || groupsResource.exists() || usersResource.exists();

        if (hasClientConfig) {
            log.info("Client-specific Keycloak configurations found for client: {}", clientName);
            log.debug("  - Roles: {}", rolesResource.exists() ? "found" : "not found");
            log.debug("  - Groups: {}", groupsResource.exists() ? "found" : "not found");
            log.debug("  - Users: {}", usersResource.exists() ? "found" : "not found");
        } else {
            log.info("No client-specific Keycloak configurations found for client: {} - Keycloak migration will be skipped", clientName);
        }

        return hasClientConfig;
    }

    /**
     * Load common configuration (runs first)
     */
    private <T> List<T> loadCommonConfiguration(String configType, TypeReference<List<T>> typeRef) {
        try {
            Resource commonResource = resourceLoader.getResource(getDefaultResourcePath(configType));
            if (commonResource.exists()) {
                List<T> config = objectMapper.readValue(commonResource.getInputStream(), typeRef);
                log.debug("Loaded common {} configuration: {} items", configType, config.size());
                return config;
            }
        } catch (Exception e) {
            log.warn("Error loading common {} configuration", configType, e);
        }

        log.debug("No common {} configuration file found", configType);
        return new ArrayList<>();
    }

    /**
     * Load client-specific configuration (runs after common)
     */
    private <T> List<T> loadClientSpecificConfiguration(String configType, TypeReference<List<T>> typeRef) {
        try {
            Resource clientResource = resourceLoader.getResource(getClientSpecificResourcePath(configType));
            if (clientResource.exists()) {
                List<T> config = objectMapper.readValue(clientResource.getInputStream(), typeRef);
                log.debug("Loaded client-specific {} configuration for {}: {} items", configType, clientName, config.size());
                return config;
            }
        } catch (Exception e) {
            log.warn("Error loading client-specific {} configuration for {}", configType, clientName, e);
        }

        log.debug("No client-specific {} configuration found for client: {}", configType, clientName);
        return new ArrayList<>();
    }

    /**
     * Load resource, trying client-specific path first, then default (deprecated - kept for backward compatibility)
     */
    @Deprecated
    private Resource loadResourceWithFallback(String configType) {
        Resource clientSpecificResource = resourceLoader.getResource(getClientSpecificResourcePath(configType));
        if (clientSpecificResource.exists()) {
            log.debug("Using client-specific {} configuration for client: {}", configType, clientName);
            return clientSpecificResource;
        }

        Resource defaultResource = resourceLoader.getResource(getDefaultResourcePath(configType));
        if (defaultResource.exists()) {
            log.debug("Using default {} configuration (client-specific not found for: {})", configType, clientName);
            return defaultResource;
        }

        log.debug("No {} configuration file found, using defaults", configType);
        return null;
    }

    /**
     * Charger les configurations des rôles (common first, then client-specific)
     */
    private List<RoleConfig> loadRoleConfigurations() {
        List<RoleConfig> allRoles = new ArrayList<>();

        try {
            // 1. Load common configuration first
            List<RoleConfig> commonRoles = loadCommonConfiguration("roles", new TypeReference<List<RoleConfig>>() {});
            allRoles.addAll(commonRoles);

            // 2. Load client-specific configuration after
            List<RoleConfig> clientRoles = loadClientSpecificConfiguration("roles", new TypeReference<List<RoleConfig>>() {});
            allRoles.addAll(clientRoles);

            if (!allRoles.isEmpty()) {
                log.info(
                    "Loaded {} total role configurations (common: {}, client-specific: {}) for client: {}",
                    allRoles.size(),
                    commonRoles.size(),
                    clientRoles.size(),
                    clientName
                );
                return allRoles;
            }
        } catch (Exception e) {
            log.warn("Error loading role configurations for client: {}", clientName, e);
        }

        // If we reach here and no client-specific files exist, return empty list (no migration)
        if (!hasClientSpecificConfigurations()) {
            log.info("No role configuration files found and no client-specific config - returning empty list for client: {}", clientName);
            return new ArrayList<>();
        }

        log.info("No role configuration files found, using default configuration for client: {}", clientName);
        return getDefaultRoleConfigurations();
    }

    /**
     * Charger les configurations des groupes (common first, then client-specific)
     */
    private List<GroupConfig> loadGroupConfigurations() {
        List<GroupConfig> allGroups = new ArrayList<>();

        try {
            // 1. Load common configuration first
            List<GroupConfig> commonGroups = loadCommonConfiguration("groups", new TypeReference<List<GroupConfig>>() {});
            allGroups.addAll(commonGroups);

            // 2. Load client-specific configuration after
            List<GroupConfig> clientGroups = loadClientSpecificConfiguration("groups", new TypeReference<List<GroupConfig>>() {});
            allGroups.addAll(clientGroups);

            if (!allGroups.isEmpty()) {
                log.info(
                    "Loaded {} total group configurations (common: {}, client-specific: {}) for client: {}",
                    allGroups.size(),
                    commonGroups.size(),
                    clientGroups.size(),
                    clientName
                );
                return allGroups;
            }
        } catch (Exception e) {
            log.warn("Error loading group configurations for client: {}", clientName, e);
        }

        // If we reach here and no client-specific files exist, return empty list (no migration)
        if (!hasClientSpecificConfigurations()) {
            log.info("No group configuration files found and no client-specific config - returning empty list for client: {}", clientName);
            return new ArrayList<>();
        }

        log.info("No group configuration files found, using default configuration for client: {}", clientName);
        return getDefaultGroupConfigurations();
    }

    /**
     * Charger les configurations des utilisateurs (common first, then client-specific)
     */
    private List<UserConfig> loadUserConfigurations() {
        List<UserConfig> allUsers = new ArrayList<>();

        try {
            // 1. Load common configuration first
            List<UserConfig> commonUsers = loadCommonConfiguration("users", new TypeReference<List<UserConfig>>() {});
            allUsers.addAll(commonUsers);

            // 2. Load client-specific configuration after
            List<UserConfig> clientUsers = loadClientSpecificConfiguration("users", new TypeReference<List<UserConfig>>() {});
            allUsers.addAll(clientUsers);

            if (!allUsers.isEmpty()) {
                log.info(
                    "Loaded {} total user configurations (common: {}, client-specific: {}) for client: {}",
                    allUsers.size(),
                    commonUsers.size(),
                    clientUsers.size(),
                    clientName
                );
                return allUsers;
            }
        } catch (Exception e) {
            log.warn("Error loading user configurations for client: {}", clientName, e);
        }

        // If we reach here and no client-specific files exist, return empty list (no migration)
        if (!hasClientSpecificConfigurations()) {
            log.info("No user configuration files found and no client-specific config - returning empty list for client: {}", clientName);
            return new ArrayList<>();
        }

        log.info("No user configuration files found, using default configuration for client: {}", clientName);
        return getDefaultUserConfigurations();
    }

    /**
     * Configuration par défaut des rôles
     */
    private List<RoleConfig> getDefaultRoleConfigurations() {
        return List.of(
            new RoleConfig("BDQM:ROLE_ADMIN", "Administrateur système - Accès complet à toutes les fonctionnalités de gestion et configuration"),
            new RoleConfig("BDQM:ROLE_AUDITOR", "Auditeur - Accès aux rapports, audits FATCA, réconciliations et suivi des anomalies"),
            new RoleConfig("BDQM:ROLE_AGENCY_USER", "Utilisateur agence - Gestion des anomalies, corrections et réconciliations au niveau agence"),
            new RoleConfig("BDQM:ROLE_USER", "Utilisateur standard - Accès de base au tableau de bord et consultation")
        );
    }

    /**
     * Configuration par défaut des groupes
     */
    private List<GroupConfig> getDefaultGroupConfigurations() {
        return List.of(
            new GroupConfig("Administrators", List.of("BDQM:ROLE_ADMIN"), null),
            new GroupConfig("Auditors", List.of("BDQM:ROLE_AUDITOR"), null),
            new GroupConfig("Agency-Users", List.of("BDQM:ROLE_AGENCY_USER"), null),
            new GroupConfig("Users", List.of("BDQM:ROLE_USER"), null)
        );
    }

    /**
     * Configuration par défaut des utilisateurs
     */
    private List<UserConfig> getDefaultUserConfigurations() {
        return List.of(
            new UserConfig(
                "admin",
                "admin@adakalgroup.com",
                "Admin",
                "ADMIN",
                "admin123",
                true,
                true,
                true,
                null,
                List.of("Administrators"),
                null
            ),
            new UserConfig(
                "auditor",
                "auditor@adakalgroup.com",
                "Auditeur",
                "BDQM",
                "auditor123",
                true,
                true,
                true,
                null,
                List.of("Auditors"),
                null
            ),
            new UserConfig(
                "agency_user",
                "agency@adakalgroup.com",
                "Agent",
                "Agence",
                "agency123",
                true,
                true,
                true,
                null,
                List.of("Agency-Users"),
                null
            ),
            new UserConfig(
                "viewer",
                "viewer@adakalgroup.com",
                "Viewer",
                "BDQM",
                "viewer123",
                true,
                true,
                true,
                null,
                List.of("Users"),
                null
            )
        );
    }

    // Classes de configuration
    @Getter
    public static class RoleConfig {

        // Getters et setters
        private String name;
        private String description;

        public RoleConfig() {}

        public RoleConfig(String name, String description) {
            this.name = name;
            this.description = description;
        }

        public void setName(String name) {
            this.name = name;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    public static class GroupConfig {

        private String name;
        private List<String> roles;
        private List<GroupConfig> subGroups;

        public GroupConfig() {}

        public GroupConfig(String name, List<String> roles, List<GroupConfig> subGroups) {
            this.name = name;
            this.roles = roles;
            this.subGroups = subGroups;
        }

        // Getters et setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<String> getRoles() {
            return roles;
        }

        public void setRoles(List<String> roles) {
            this.roles = roles;
        }

        public List<GroupConfig> getSubGroups() {
            return subGroups;
        }

        public void setSubGroups(List<GroupConfig> subGroups) {
            this.subGroups = subGroups;
        }
    }

    public static class UserConfig {

        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String password;
        private boolean temporary;
        private boolean enabled;
        private boolean emailVerified;
        private List<String> roles;
        private List<String> groups;
        private Map<String, List<String>> attributes;

        public UserConfig() {}

        public UserConfig(
            String username,
            String email,
            String firstName,
            String lastName,
            String password,
            boolean temporary,
            boolean enabled,
            boolean emailVerified,
            List<String> roles,
            List<String> groups,
            Map<String, List<String>> attributes
        ) {
            this.username = username;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.password = password;
            this.temporary = temporary;
            this.enabled = enabled;
            this.emailVerified = emailVerified;
            this.roles = roles;
            this.groups = groups;
            this.attributes = attributes;
        }

        // Getters et setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public boolean isTemporary() {
            return temporary;
        }

        public void setTemporary(boolean temporary) {
            this.temporary = temporary;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public boolean isEmailVerified() {
            return emailVerified;
        }

        public void setEmailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
        }

        public List<String> getRoles() {
            return roles;
        }

        public void setRoles(List<String> roles) {
            this.roles = roles;
        }

        public List<String> getGroups() {
            return groups;
        }

        public void setGroups(List<String> groups) {
            this.groups = groups;
        }

        public Map<String, List<String>> getAttributes() {
            return attributes;
        }

        public void setAttributes(Map<String, List<String>> attributes) {
            this.attributes = attributes;
        }
    }
}
