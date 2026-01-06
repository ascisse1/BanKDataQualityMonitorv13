package com.bsic.dataqualitybackend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Utility class for Spring Security operations (BFF/Session-based pattern).
 * Provides methods to check authentication status, extract user info, and verify authorities.
 *
 * Works with OAuth2AuthenticationToken and OidcUser from session-based authentication.
 */
public final class SecurityUtils {

    private static final String ROLE_PREFIX = "ROLE_";

    private SecurityUtils() {
        // Utility class
    }

    /**
     * Get the login of the current user.
     *
     * @return the login of the current user.
     */
    public static Optional<String> getCurrentUserLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return Optional.empty();
        }

        if (authentication instanceof OAuth2AuthenticationToken oauth2Token) {
            Object principal = oauth2Token.getPrincipal();
            if (principal instanceof OidcUser oidcUser) {
                String username = oidcUser.getPreferredUsername();
                return Optional.ofNullable(username != null ? username : oidcUser.getSubject());
            }
        }

        return Optional.ofNullable(authentication.getName());
    }

    /**
     * Check if the current user is authenticated.
     *
     * @return true if authenticated, false otherwise.
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getAuthorities().stream()
                        .noneMatch(a -> a.getAuthority().equals("ROLE_ANONYMOUS"));
    }

    /**
     * Check if the current user has a specific authority.
     *
     * @param authority the authority to check.
     * @return true if the user has the authority.
     */
    public static boolean hasCurrentUserThisAuthority(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(authority) ||
                        a.getAuthority().equals(ROLE_PREFIX + authority));
    }

    /**
     * Check if the current user has any of the specified authorities.
     *
     * @param authorities the authorities to check.
     * @return true if the user has any of the authorities.
     */
    public static boolean hasCurrentUserAnyOfAuthorities(String... authorities) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return false;
        }

        Set<String> authoritySet = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        for (String authority : authorities) {
            if (authoritySet.contains(authority) || authoritySet.contains(ROLE_PREFIX + authority)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the current user has none of the specified authorities.
     *
     * @param authorities the authorities to check.
     * @return true if the user has none of the authorities.
     */
    public static boolean hasCurrentUserNoneOfAuthorities(String... authorities) {
        return !hasCurrentUserAnyOfAuthorities(authorities);
    }

    /**
     * Get the email of the current user.
     *
     * @return the email of the current user.
     */
    public static Optional<String> getCurrentUserEmail() {
        return getOidcUser().map(OidcUser::getEmail);
    }

    /**
     * Get the agency code of the current user (custom Keycloak attribute).
     *
     * @return the agency code of the current user.
     */
    public static Optional<String> getCurrentUserAgencyCode() {
        return getOidcUser().map(oidcUser -> oidcUser.getClaimAsString("agency_code"));
    }

    /**
     * Get the full name of the current user.
     *
     * @return the full name of the current user.
     */
    public static Optional<String> getCurrentUserFullName() {
        return getOidcUser().map(OidcUser::getFullName);
    }

    /**
     * Get the user ID (subject) of the current user.
     *
     * @return the user ID.
     */
    public static Optional<String> getCurrentUserId() {
        return getOidcUser().map(OidcUser::getSubject);
    }

    /**
     * Get all authorities of the current user.
     *
     * @return set of authority strings.
     */
    public static Set<String> getCurrentUserAuthorities() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return Collections.emptySet();
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    /**
     * Extract authorities from OIDC claims.
     * Supports multiple claim sources: groups, roles, realm_access.roles, resource_access.
     *
     * @param claims the claims map.
     * @return list of granted authorities.
     */
    @SuppressWarnings("unchecked")
    public static List<GrantedAuthority> extractAuthorityFromClaims(Map<String, Object> claims) {
        return getRolesFromClaims(claims).stream()
                .filter(role -> role.startsWith(ROLE_PREFIX))
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    /**
     * Get roles from multiple possible claim locations.
     *
     * @param claims the claims map.
     * @return collection of role strings.
     */
    @SuppressWarnings("unchecked")
    private static Collection<String> getRolesFromClaims(Map<String, Object> claims) {
        Set<String> roles = new HashSet<>();

        // 1. Check 'groups' claim
        Object groupsClaim = claims.get("groups");
        if (groupsClaim instanceof Collection<?> groups) {
            groups.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .forEach(roles::add);
        }

        // 2. Check 'roles' claim (direct)
        Object rolesClaim = claims.get("roles");
        if (rolesClaim instanceof Collection<?> directRoles) {
            directRoles.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .forEach(roles::add);
        }

        // 3. Check 'realm_access.roles' (Keycloak standard)
        Object realmAccess = claims.get("realm_access");
        if (realmAccess instanceof Map<?, ?> realmAccessMap) {
            Object realmRoles = realmAccessMap.get("roles");
            if (realmRoles instanceof Collection<?> realmRolesList) {
                realmRolesList.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .map(role -> ROLE_PREFIX + role.toUpperCase())
                        .forEach(roles::add);
            }
        }

        // 4. Check 'resource_access.<client>.roles' (Keycloak client roles)
        Object resourceAccess = claims.get("resource_access");
        if (resourceAccess instanceof Map<?, ?> resourceAccessMap) {
            resourceAccessMap.values().stream()
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .flatMap(clientAccess -> {
                        Object clientRoles = clientAccess.get("roles");
                        if (clientRoles instanceof Collection<?> clientRolesList) {
                            return clientRolesList.stream()
                                    .filter(String.class::isInstance)
                                    .map(String.class::cast)
                                    .map(role -> ROLE_PREFIX + role.toUpperCase());
                        }
                        return Stream.empty();
                    })
                    .forEach(roles::add);
        }

        return roles;
    }

    /**
     * Get the current OIDC user from security context.
     *
     * @return the OIDC user.
     */
    public static Optional<OidcUser> getOidcUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof OAuth2AuthenticationToken oauth2Token) {
            Object principal = oauth2Token.getPrincipal();
            if (principal instanceof OidcUser oidcUser) {
                return Optional.of(oidcUser);
            }
        }

        return Optional.empty();
    }

    /**
     * Get a specific claim from the current user.
     *
     * @param claimName the name of the claim.
     * @return the claim value.
     */
    public static Optional<Object> getCurrentClaim(String claimName) {
        return getOidcUser().map(oidcUser -> oidcUser.getClaim(claimName));
    }
}
