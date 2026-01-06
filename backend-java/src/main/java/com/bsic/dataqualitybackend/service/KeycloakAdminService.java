package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.config.KeycloakAdminConfig;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.resource.GroupResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.GroupRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing users and groups in Keycloak.
 * Uses Keycloak Admin Client for server-side operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KeycloakAdminService {

    private final KeycloakAdminConfig keycloakConfig;

    // ==================== USER MANAGEMENT ====================

    /**
     * Creates a new user in Keycloak.
     *
     * @param username    the username.
     * @param email       the email address.
     * @param firstName   the first name.
     * @param lastName    the last name.
     * @param password    the initial password.
     * @param enabled     whether the user should be enabled.
     * @return the created user's ID, or empty if creation failed.
     */
    public Optional<String> createUser(String username, String email, String firstName,
                                        String lastName, String password, boolean enabled) {
        try {
            UserRepresentation user = new UserRepresentation();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(enabled);
            user.setEmailVerified(false);

            // Set password credential
            CredentialRepresentation credential = createPasswordCredential(password);
            user.setCredentials(List.of(credential));

            Response response = keycloakConfig.getUsersResource().create(user);

            if (response.getStatus() == 201) {
                String userId = extractUserIdFromLocation(response);
                log.info("User created successfully: username={}, id={}", username, userId);
                return Optional.ofNullable(userId);
            } else {
                log.warn("Failed to create user {}: status={}", username, response.getStatus());
                return Optional.empty();
            }
        } catch (Exception e) {
            log.error("Error creating user {}: {}", username, e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Gets a user by username.
     *
     * @param username the username.
     * @return the user representation, or empty if not found.
     */
    public Optional<UserRepresentation> getUserByUsername(String username) {
        try {
            List<UserRepresentation> users = keycloakConfig.getUsersResource()
                    .searchByUsername(username, true);
            return users.stream().findFirst();
        } catch (Exception e) {
            log.error("Error getting user {}: {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Gets a user by ID.
     *
     * @param userId the user ID.
     * @return the user representation, or empty if not found.
     */
    public Optional<UserRepresentation> getUserById(String userId) {
        try {
            return Optional.of(keycloakConfig.getUsersResource().get(userId).toRepresentation());
        } catch (Exception e) {
            log.error("Error getting user by id {}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Gets a user by email.
     *
     * @param email the email address.
     * @return the user representation, or empty if not found.
     */
    public Optional<UserRepresentation> getUserByEmail(String email) {
        try {
            List<UserRepresentation> users = keycloakConfig.getUsersResource()
                    .searchByEmail(email, true);
            return users.stream().findFirst();
        } catch (Exception e) {
            log.error("Error getting user by email {}: {}", email, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Updates a user's information.
     *
     * @param userId      the user ID.
     * @param firstName   the new first name (null to skip).
     * @param lastName    the new last name (null to skip).
     * @param email       the new email (null to skip).
     * @return true if successful.
     */
    public boolean updateUser(String userId, String firstName, String lastName, String email) {
        try {
            UserResource userResource = keycloakConfig.getUsersResource().get(userId);
            UserRepresentation user = userResource.toRepresentation();

            if (firstName != null) user.setFirstName(firstName);
            if (lastName != null) user.setLastName(lastName);
            if (email != null) user.setEmail(email);

            userResource.update(user);
            log.info("User updated: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Error updating user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    /**
     * Enables or disables a user.
     *
     * @param userId  the user ID.
     * @param enabled true to enable, false to disable.
     * @return true if successful.
     */
    public boolean setUserEnabled(String userId, boolean enabled) {
        try {
            UserResource userResource = keycloakConfig.getUsersResource().get(userId);
            UserRepresentation user = userResource.toRepresentation();
            user.setEnabled(enabled);
            userResource.update(user);
            log.info("User {} {}", userId, enabled ? "enabled" : "disabled");
            return true;
        } catch (Exception e) {
            log.error("Error setting user enabled status {}: {}", userId, e.getMessage());
            return false;
        }
    }

    /**
     * Deletes a user.
     *
     * @param userId the user ID.
     * @return true if successful.
     */
    public boolean deleteUser(String userId) {
        try {
            keycloakConfig.getUsersResource().delete(userId);
            log.info("User deleted: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Error deleting user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    // ==================== PASSWORD MANAGEMENT ====================

    /**
     * Changes a user's password.
     *
     * @param userId      the user ID.
     * @param newPassword the new password.
     * @param temporary   if true, user must change password on next login.
     * @return true if successful.
     */
    public boolean changePassword(String userId, String newPassword, boolean temporary) {
        try {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(newPassword);
            credential.setTemporary(temporary);

            keycloakConfig.getUsersResource().get(userId).resetPassword(credential);
            log.info("Password changed for user: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Error changing password for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    /**
     * Sends a password reset email to the user.
     *
     * @param userId the user ID.
     * @return true if successful.
     */
    public boolean sendPasswordResetEmail(String userId) {
        try {
            keycloakConfig.getUsersResource().get(userId)
                    .executeActionsEmail(List.of("UPDATE_PASSWORD"));
            log.info("Password reset email sent to user: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Error sending password reset email to {}: {}", userId, e.getMessage());
            return false;
        }
    }

    // ==================== GROUP MANAGEMENT ====================

    /**
     * Gets all groups in the realm.
     *
     * @return list of groups.
     */
    public List<GroupRepresentation> getAllGroups() {
        try {
            return keycloakConfig.getRealmResource().groups().groups();
        } catch (Exception e) {
            log.error("Error getting groups: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Gets a group by name.
     *
     * @param groupName the group name.
     * @return the group, or empty if not found.
     */
    public Optional<GroupRepresentation> getGroupByName(String groupName) {
        try {
            return keycloakConfig.getRealmResource().groups()
                    .groups(groupName, 0, 1)
                    .stream()
                    .filter(g -> g.getName().equals(groupName))
                    .findFirst();
        } catch (Exception e) {
            log.error("Error getting group {}: {}", groupName, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Creates a new group.
     *
     * @param groupName the group name.
     * @return the group ID, or empty if creation failed.
     */
    public Optional<String> createGroup(String groupName) {
        try {
            GroupRepresentation group = new GroupRepresentation();
            group.setName(groupName);

            Response response = keycloakConfig.getRealmResource().groups().add(group);

            if (response.getStatus() == 201) {
                String groupId = extractIdFromLocation(response);
                log.info("Group created: name={}, id={}", groupName, groupId);
                return Optional.ofNullable(groupId);
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error creating group {}: {}", groupName, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Adds a user to a group.
     *
     * @param userId  the user ID.
     * @param groupId the group ID.
     * @return true if successful.
     */
    public boolean addUserToGroup(String userId, String groupId) {
        try {
            keycloakConfig.getUsersResource().get(userId).joinGroup(groupId);
            log.info("User {} added to group {}", userId, groupId);
            return true;
        } catch (Exception e) {
            log.error("Error adding user {} to group {}: {}", userId, groupId, e.getMessage());
            return false;
        }
    }

    /**
     * Removes a user from a group.
     *
     * @param userId  the user ID.
     * @param groupId the group ID.
     * @return true if successful.
     */
    public boolean removeUserFromGroup(String userId, String groupId) {
        try {
            keycloakConfig.getUsersResource().get(userId).leaveGroup(groupId);
            log.info("User {} removed from group {}", userId, groupId);
            return true;
        } catch (Exception e) {
            log.error("Error removing user {} from group {}: {}", userId, groupId, e.getMessage());
            return false;
        }
    }

    /**
     * Gets all groups a user belongs to.
     *
     * @param userId the user ID.
     * @return list of groups.
     */
    public List<GroupRepresentation> getUserGroups(String userId) {
        try {
            return keycloakConfig.getUsersResource().get(userId).groups();
        } catch (Exception e) {
            log.error("Error getting groups for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ==================== ROLE MANAGEMENT ====================

    /**
     * Gets all realm roles.
     *
     * @return list of roles.
     */
    public List<RoleRepresentation> getAllRealmRoles() {
        try {
            return keycloakConfig.getRealmResource().roles().list();
        } catch (Exception e) {
            log.error("Error getting realm roles: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Assigns a realm role to a user.
     *
     * @param userId   the user ID.
     * @param roleName the role name.
     * @return true if successful.
     */
    public boolean assignRealmRoleToUser(String userId, String roleName) {
        try {
            RoleRepresentation role = keycloakConfig.getRealmResource()
                    .roles().get(roleName).toRepresentation();

            keycloakConfig.getUsersResource().get(userId)
                    .roles().realmLevel().add(List.of(role));

            log.info("Role {} assigned to user {}", roleName, userId);
            return true;
        } catch (Exception e) {
            log.error("Error assigning role {} to user {}: {}", roleName, userId, e.getMessage());
            return false;
        }
    }

    /**
     * Removes a realm role from a user.
     *
     * @param userId   the user ID.
     * @param roleName the role name.
     * @return true if successful.
     */
    public boolean removeRealmRoleFromUser(String userId, String roleName) {
        try {
            RoleRepresentation role = keycloakConfig.getRealmResource()
                    .roles().get(roleName).toRepresentation();

            keycloakConfig.getUsersResource().get(userId)
                    .roles().realmLevel().remove(List.of(role));

            log.info("Role {} removed from user {}", roleName, userId);
            return true;
        } catch (Exception e) {
            log.error("Error removing role {} from user {}: {}", roleName, userId, e.getMessage());
            return false;
        }
    }

    /**
     * Gets all realm roles assigned to a user.
     *
     * @param userId the user ID.
     * @return list of role names.
     */
    public List<String> getUserRealmRoles(String userId) {
        try {
            return keycloakConfig.getUsersResource().get(userId)
                    .roles().realmLevel().listEffective()
                    .stream()
                    .map(RoleRepresentation::getName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting roles for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ==================== USER ATTRIBUTES ====================

    /**
     * Sets a custom attribute on a user.
     *
     * @param userId         the user ID.
     * @param attributeName  the attribute name.
     * @param attributeValue the attribute value.
     * @return true if successful.
     */
    public boolean setUserAttribute(String userId, String attributeName, String attributeValue) {
        try {
            UserResource userResource = keycloakConfig.getUsersResource().get(userId);
            UserRepresentation user = userResource.toRepresentation();

            Map<String, List<String>> attributes = user.getAttributes();
            if (attributes == null) {
                attributes = new HashMap<>();
            }
            attributes.put(attributeName, List.of(attributeValue));
            user.setAttributes(attributes);

            userResource.update(user);
            log.info("Attribute {} set for user {}", attributeName, userId);
            return true;
        } catch (Exception e) {
            log.error("Error setting attribute {} for user {}: {}", attributeName, userId, e.getMessage());
            return false;
        }
    }

    /**
     * Gets a custom attribute from a user.
     *
     * @param userId        the user ID.
     * @param attributeName the attribute name.
     * @return the attribute value, or empty if not found.
     */
    public Optional<String> getUserAttribute(String userId, String attributeName) {
        try {
            UserRepresentation user = keycloakConfig.getUsersResource()
                    .get(userId).toRepresentation();

            Map<String, List<String>> attributes = user.getAttributes();
            if (attributes != null && attributes.containsKey(attributeName)) {
                List<String> values = attributes.get(attributeName);
                if (!values.isEmpty()) {
                    return Optional.of(values.get(0));
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error getting attribute {} for user {}: {}", attributeName, userId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Sets the agency code for a user (custom attribute).
     *
     * @param userId     the user ID.
     * @param agencyCode the agency code.
     * @return true if successful.
     */
    public boolean setUserAgencyCode(String userId, String agencyCode) {
        return setUserAttribute(userId, keycloakConfig.getAgencyCodeClaim(), agencyCode);
    }

    // ==================== HELPER METHODS ====================

    private CredentialRepresentation createPasswordCredential(String password) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setTemporary(false);
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        return credential;
    }

    private String extractUserIdFromLocation(Response response) {
        return extractIdFromLocation(response);
    }

    private String extractIdFromLocation(Response response) {
        String location = response.getHeaderString("Location");
        if (location != null) {
            String[] parts = location.split("/");
            return parts[parts.length - 1];
        }
        return null;
    }
}
