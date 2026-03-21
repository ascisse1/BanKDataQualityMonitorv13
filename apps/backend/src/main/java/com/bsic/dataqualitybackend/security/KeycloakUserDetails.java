package com.bsic.dataqualitybackend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Utility component for extracting user details from OIDC session (BFF pattern).
 * Provides convenient methods to access user information in services and controllers.
 *
 * Works with session-based OAuth2 authentication (OAuth2AuthenticationToken + OidcUser).
 */
@Component
public class KeycloakUserDetails {

    @Value("${keycloak.agency-code-claim:agency_code}")
    private String agencyCodeClaim;

    /**
     * Gets the current username from the OIDC user.
     * Prefers preferred_username, falls back to subject (sub).
     */
    public Optional<String> getCurrentUsername() {
        return getOidcUser().map(oidcUser -> {
            String preferredUsername = oidcUser.getPreferredUsername();
            return preferredUsername != null ? preferredUsername : oidcUser.getSubject();
        });
    }

    /**
     * Gets the current user's email.
     */
    public Optional<String> getCurrentEmail() {
        return getOidcUser().map(OidcUser::getEmail);
    }

    /**
     * Gets the current user's agency code.
     * This is a custom attribute configured in Keycloak.
     */
    public Optional<String> getCurrentAgencyCode() {
        return getOidcUser().map(oidcUser -> oidcUser.getClaimAsString(agencyCodeClaim));
    }

    /**
     * Gets the current user's full name.
     */
    public Optional<String> getCurrentFullName() {
        return getOidcUser().map(oidcUser -> {
            String fullName = oidcUser.getFullName();
            if (fullName != null) {
                return fullName;
            }
            String givenName = oidcUser.getGivenName();
            String familyName = oidcUser.getFamilyName();
            if (givenName != null && familyName != null) {
                return givenName + " " + familyName;
            }
            return givenName;
        });
    }

    /**
     * Gets the current user's Keycloak subject ID (unique identifier).
     */
    public Optional<String> getCurrentUserId() {
        return getOidcUser().map(OidcUser::getSubject);
    }

    /**
     * Gets the current user's first name.
     */
    public Optional<String> getCurrentFirstName() {
        return getOidcUser().map(OidcUser::getGivenName);
    }

    /**
     * Gets the current user's last name.
     */
    public Optional<String> getCurrentLastName() {
        return getOidcUser().map(OidcUser::getFamilyName);
    }

    /**
     * Gets all roles assigned to the current user.
     * Returns roles without the ROLE_ prefix.
     */
    public List<String> getCurrentRoles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(auth -> auth.startsWith("ROLE_"))
                    .map(auth -> auth.substring(5)) // Remove ROLE_ prefix
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    /**
     * Checks if the current user has a specific role.
     */
    public boolean hasRole(String role) {
        return getCurrentRoles().stream()
                .anyMatch(r -> r.equalsIgnoreCase(role));
    }

    /**
     * Checks if the current user has any of the specified roles.
     */
    public boolean hasAnyRole(String... roles) {
        List<String> currentRoles = getCurrentRoles();
        for (String role : roles) {
            if (currentRoles.stream().anyMatch(r -> r.equalsIgnoreCase(role))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets a specific claim from the OIDC user.
     */
    public Optional<Object> getClaim(String claimName) {
        return getOidcUser().map(oidcUser -> oidcUser.getClaim(claimName));
    }

    /**
     * Checks if the current user is authenticated.
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated()
                && authentication instanceof OAuth2AuthenticationToken;
    }

    /**
     * Gets the OIDC user from the current security context.
     */
    private Optional<OidcUser> getOidcUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof OAuth2AuthenticationToken oauth2Token) {
            Object principal = oauth2Token.getPrincipal();
            if (principal instanceof OidcUser oidcUser) {
                return Optional.of(oidcUser);
            }
        }
        return Optional.empty();
    }
}
