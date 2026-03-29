package com.bsic.dataqualitybackend.security;

import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.UserProfile;
import com.bsic.dataqualitybackend.repository.UserProfileRepository;
import com.bsic.dataqualitybackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class StructureSecurityService {

    private final KeycloakUserDetails keycloakUserDetails;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    /**
     * Returns list of agency codes the current user can access.
     * Empty list = global access (ADMIN/AUDITOR/system).
     */
    public List<String> getAgencyFilter() {
        if (!keycloakUserDetails.isAuthenticated()) return List.of();
        if (keycloakUserDetails.hasAnyRole("ADMIN", "AUDITOR")) return List.of();

        String username = keycloakUserDetails.getCurrentUsername()
            .orElseThrow(() -> new AccessDeniedException("No username in token"));

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new AccessDeniedException("User not found"));

        return userProfileRepository
            .findActiveByUserId(user.getId(), LocalDate.now())
            .stream()
            .map(up -> up.getStructure().getCode())
            .collect(Collectors.toList());
    }

    /**
     * Throws 403 if current user cannot access the given agency.
     */
    public void requireAgencyAccess(String agencyCode) {
        List<String> allowed = getAgencyFilter();
        if (!allowed.isEmpty() && !allowed.contains(agencyCode)) {
            throw new AccessDeniedException("Access denied to agency: " + agencyCode);
        }
    }

    /**
     * Returns true if user has global access (no filtering needed).
     */
    public boolean isGlobalAccess() {
        return getAgencyFilter().isEmpty();
    }

    /**
     * Checks if the current user has a specific role (from Keycloak token).
     * Roles on profiles are managed via Keycloak Group role mappings.
     */
    public void requireRole(String role) {
        if (!keycloakUserDetails.hasRole(role)) {
            throw new AccessDeniedException("Role required: " + role);
        }
    }

    /**
     * Returns the active UserProfiles for the current user.
     */
    public List<UserProfile> getCurrentUserProfiles() {
        if (!keycloakUserDetails.isAuthenticated()) return List.of();

        String username = keycloakUserDetails.getCurrentUsername().orElse(null);
        if (username == null) return List.of();

        return userRepository.findByUsername(username)
            .map(user -> userProfileRepository.findActiveByUserId(user.getId(), LocalDate.now()))
            .orElse(List.of());
    }
}
