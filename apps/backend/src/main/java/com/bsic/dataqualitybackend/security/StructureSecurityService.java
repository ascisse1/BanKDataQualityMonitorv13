package com.bsic.dataqualitybackend.security;

import com.bsic.dataqualitybackend.model.User;
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
}
