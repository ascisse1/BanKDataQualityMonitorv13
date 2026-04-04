package com.adakalgroup.dataqualitybackend.service.keycloak;

import com.adakalgroup.dataqualitybackend.model.AppProfile;
import com.adakalgroup.dataqualitybackend.model.User;
import com.adakalgroup.dataqualitybackend.model.UserProfile;
import com.adakalgroup.dataqualitybackend.repository.AppProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.GroupRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Synchronizes AppProfile ↔ Keycloak Group membership.
 *
 * When a UserProfile is created (user assigned to a structure with a profile),
 * the user is added to the corresponding Keycloak group.
 * When deactivated, the user is removed from the group.
 *
 * Each AppProfile maps 1:1 to a Keycloak Group (created on demand).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KeycloakGroupSyncService {

    private final KeycloakAdminService keycloakAdminService;
    private final AppProfileRepository appProfileRepository;

    /**
     * Ensures a Keycloak group exists for the given AppProfile.
     * Creates the group if it doesn't exist and stores the Keycloak group ID.
     */
    public String ensureKeycloakGroup(AppProfile profile) {
        if (profile.getKeycloakGroupId() != null) {
            return profile.getKeycloakGroupId();
        }

        String groupName = profile.getCode();

        // Check if group already exists
        Optional<GroupRepresentation> existing = keycloakAdminService.getGroupByName(groupName);
        String groupId;

        if (existing.isPresent()) {
            groupId = existing.get().getId();
            log.info("Found existing Keycloak group for profile {}: {}", profile.getCode(), groupId);
        } else {
            groupId = keycloakAdminService.createGroup(groupName)
                .orElseThrow(() -> new RuntimeException("Failed to create Keycloak group: " + groupName));
            log.info("Created Keycloak group for profile {}: {}", profile.getCode(), groupId);
        }

        // Store the group ID in the profile
        profile.setKeycloakGroupId(groupId);
        appProfileRepository.save(profile);

        return groupId;
    }

    /**
     * Syncs all AppProfiles with Keycloak groups.
     * - Profiles with no keycloakGroupId: tries to find existing group by name, or creates one.
     * - Also discovers existing Keycloak groups matching by profile code or name.
     * Returns a summary of what was synced.
     */
    public Map<String, Object> syncAllProfiles() {
        List<AppProfile> profiles = appProfileRepository.findAll();
        List<GroupRepresentation> allGroups = keycloakAdminService.getAllGroups();

        // Build a lookup of existing KC groups by name
        Map<String, GroupRepresentation> kcGroupsByName = new HashMap<>();
        for (GroupRepresentation g : allGroups) {
            kcGroupsByName.put(g.getName(), g);
            // Also recurse subgroups
            if (g.getSubGroups() != null) {
                for (GroupRepresentation sub : g.getSubGroups()) {
                    kcGroupsByName.put(sub.getName(), sub);
                }
            }
        }

        int linked = 0;
        int created = 0;
        int alreadySynced = 0;

        for (AppProfile profile : profiles) {
            String groupName = profile.getCode();

            if (profile.getKeycloakGroupId() != null) {
                alreadySynced++;
                continue;
            }

            GroupRepresentation existing = kcGroupsByName.get(groupName);
            if (existing != null) {
                profile.setKeycloakGroupId(existing.getId());
                appProfileRepository.save(profile);
                linked++;
                log.info("Linked profile {} to existing Keycloak group {}", profile.getCode(), existing.getId());
            } else {
                // Also try matching by profile name (group might use display name)
                GroupRepresentation byName = kcGroupsByName.get(profile.getName());
                if (byName != null) {
                    profile.setKeycloakGroupId(byName.getId());
                    appProfileRepository.save(profile);
                    linked++;
                    log.info("Linked profile {} to Keycloak group {} (matched by name)", profile.getCode(), byName.getId());
                } else {
                    try {
                        String groupId = keycloakAdminService.createGroup(groupName)
                            .orElse(null);
                        if (groupId != null) {
                            profile.setKeycloakGroupId(groupId);
                            appProfileRepository.save(profile);
                            created++;
                            log.info("Created Keycloak group for profile {}: {}", profile.getCode(), groupId);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to create group for profile {}: {}", profile.getCode(), e.getMessage());
                    }
                }
            }
        }

        // ── Reverse sync: Keycloak groups → AppProfile ──────────────
        // Import Keycloak groups that have no matching AppProfile
        int imported = 0;

        // Build lookup of all profile keycloakGroupIds and codes/names for matching
        Map<String, AppProfile> profilesByKeycloakId = new HashMap<>();
        Map<String, AppProfile> profilesByCode = new HashMap<>();
        Map<String, AppProfile> profilesByName = new HashMap<>();
        for (AppProfile p : appProfileRepository.findAll()) {
            if (p.getKeycloakGroupId() != null) {
                profilesByKeycloakId.put(p.getKeycloakGroupId(), p);
            }
            profilesByCode.put(p.getCode(), p);
            profilesByName.put(p.getName(), p);
        }

        for (GroupRepresentation group : kcGroupsByName.values()) {
            // Skip if already linked to a profile
            if (profilesByKeycloakId.containsKey(group.getId())) continue;
            // Skip if a profile with the same code or name already exists (will be linked above on next sync)
            if (profilesByCode.containsKey(group.getName())) continue;
            if (profilesByName.containsKey(group.getName())) continue;

            try {
                AppProfile newProfile = AppProfile.builder()
                        .code(group.getName().toUpperCase().replaceAll("[^A-Z0-9_]", "_"))
                        .name(group.getName())
                        .description("Imported from Keycloak group")
                        .status("ACTIVE")
                        .keycloakGroupId(group.getId())
                        .build();
                appProfileRepository.save(newProfile);
                imported++;
                log.info("Imported Keycloak group '{}' as new AppProfile (code={})",
                        group.getName(), newProfile.getCode());
            } catch (Exception e) {
                log.warn("Failed to import Keycloak group '{}': {}", group.getName(), e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalProfiles", profiles.size());
        result.put("alreadySynced", alreadySynced);
        result.put("linked", linked);
        result.put("createdInKeycloak", created);
        result.put("importedFromKeycloak", imported);
        result.put("keycloakGroups", kcGroupsByName.size());
        return result;
    }

    /**
     * Called when a UserProfile is created/activated.
     * Adds the user to the Keycloak group corresponding to the AppProfile.
     */
    @Async
    public void onUserProfileAssigned(UserProfile userProfile) {
        if (userProfile.getProfile() == null) {
            log.debug("UserProfile {} has no AppProfile, skipping Keycloak sync", userProfile.getId());
            return;
        }

        User user = userProfile.getUser();
        AppProfile profile = userProfile.getProfile();

        if (user.getKeycloakId() == null) {
            // Try to find the user in Keycloak by username
            Optional<UserRepresentation> kcUser = keycloakAdminService.getUserByUsername(user.getUsername());
            if (kcUser.isEmpty()) {
                log.warn("User {} has no keycloakId and not found in Keycloak, skipping group sync",
                    user.getUsername());
                return;
            }
            user.setKeycloakId(kcUser.get().getId());
        }

        try {
            String groupId = ensureKeycloakGroup(profile);
            boolean success = keycloakAdminService.addUserToGroup(user.getKeycloakId(), groupId);
            if (success) {
                log.info("Synced to Keycloak: user {} added to group {} (profile {})",
                    user.getUsername(), groupId, profile.getCode());
            } else {
                log.warn("Failed to add user {} to Keycloak group {} (profile {})",
                    user.getUsername(), groupId, profile.getCode());
            }
        } catch (Exception e) {
            log.error("Keycloak sync failed for user {} profile {}: {}",
                user.getUsername(), profile.getCode(), e.getMessage());
        }
    }

    /**
     * Called when a UserProfile is deactivated.
     * Removes the user from the Keycloak group corresponding to the AppProfile.
     */
    @Async
    public void onUserProfileDeactivated(UserProfile userProfile) {
        if (userProfile.getProfile() == null) {
            return;
        }

        User user = userProfile.getUser();
        AppProfile profile = userProfile.getProfile();

        if (user.getKeycloakId() == null) {
            Optional<UserRepresentation> kcUser = keycloakAdminService.getUserByUsername(user.getUsername());
            if (kcUser.isEmpty()) {
                log.warn("User {} not found in Keycloak, skipping group removal", user.getUsername());
                return;
            }
            user.setKeycloakId(kcUser.get().getId());
        }

        if (profile.getKeycloakGroupId() == null) {
            log.debug("Profile {} has no Keycloak group ID, skipping removal", profile.getCode());
            return;
        }

        try {
            boolean success = keycloakAdminService.removeUserFromGroup(
                user.getKeycloakId(), profile.getKeycloakGroupId());
            if (success) {
                log.info("Synced to Keycloak: user {} removed from group {} (profile {})",
                    user.getUsername(), profile.getKeycloakGroupId(), profile.getCode());
            }
        } catch (Exception e) {
            log.error("Keycloak sync failed for user {} profile {}: {}",
                user.getUsername(), profile.getCode(), e.getMessage());
        }
    }
}
