package com.adakalgroup.dataqualitybackend.security;

import com.adakalgroup.dataqualitybackend.model.User;
import com.adakalgroup.dataqualitybackend.repository.UserProfileRepository;
import com.adakalgroup.dataqualitybackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Request-scoped bean that resolves the current user's accessible structure codes
 * exactly once per HTTP request. All components that need tenancy info share this instance.
 *
 * Empty list = global access (ADMIN/AUDITOR/unauthenticated/system context).
 */
@Slf4j
@Component
@RequestScope
@RequiredArgsConstructor
public class StructureFilterContext {

    private final KeycloakUserDetails keycloakUserDetails;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    private List<String> structureCodes;
    private boolean resolved = false;

    /**
     * Returns the list of structure codes the current user can access.
     * Empty list = global access (no filtering needed).
     * Resolved lazily on the first call, cached for the rest of the request.
     */
    public List<String> getStructureCodes() {
        if (!resolved) {
            resolve();
        }
        return structureCodes;
    }

    public boolean isGlobalAccess() {
        return getStructureCodes().isEmpty();
    }

    private void resolve() {
        resolved = true;

        if (!keycloakUserDetails.isAuthenticated()) {
            structureCodes = List.of();
            return;
        }

        if (keycloakUserDetails.hasAnyRole("ADMIN", "AUDITOR")) {
            structureCodes = List.of();
            return;
        }

        String username = keycloakUserDetails.getCurrentUsername().orElse(null);
        if (username == null) {
            structureCodes = List.of();
            return;
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            structureCodes = List.of();
            return;
        }

        structureCodes = userProfileRepository
            .findActiveByUserId(user.getId(), LocalDate.now())
            .stream()
            .map(up -> up.getStructure().getCode())
            .collect(Collectors.toList());

        log.debug("Resolved structure filter for user {}: {}", username, structureCodes);
    }
}
