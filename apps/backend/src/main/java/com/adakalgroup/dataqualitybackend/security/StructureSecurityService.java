package com.adakalgroup.dataqualitybackend.security;

import com.adakalgroup.dataqualitybackend.model.UserProfile;
import com.adakalgroup.dataqualitybackend.repository.UserProfileRepository;
import com.adakalgroup.dataqualitybackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class StructureSecurityService {

    private final StructureFilterContext filterContext;
    private final KeycloakUserDetails keycloakUserDetails;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    /**
     * Returns list of structure codes the current user can access.
     * Empty list = global access (ADMIN/AUDITOR/system).
     * Delegates to request-scoped StructureFilterContext (cached per request).
     */
    public List<String> getAgencyFilter() {
        return filterContext.getStructureCodes();
    }

    /**
     * Throws 403 if current user cannot access the given structure/agency.
     */
    public void requireAgencyAccess(String structureCode) {
        List<String> allowed = getAgencyFilter();
        if (!allowed.isEmpty() && !allowed.contains(structureCode)) {
            throw new AccessDeniedException("Access denied to agency: " + structureCode);
        }
    }

    /**
     * Returns true if user has global access (no filtering needed).
     */
    public boolean isGlobalAccess() {
        return filterContext.isGlobalAccess();
    }

    /**
     * Checks if the current user has a specific role (from Keycloak token).
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
