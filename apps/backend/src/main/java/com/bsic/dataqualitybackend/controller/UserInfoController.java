package com.bsic.dataqualitybackend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller providing current user information for authenticated sessions.
 * Used by the frontend to get user details after OAuth2 login.
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserInfoController {

    /**
     * Returns information about the currently authenticated user.
     * This endpoint is used by the frontend to populate user context.
     *
     * @param principal The OIDC user from the session
     * @param authentication The authentication object
     * @return User information including roles and agency code
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @AuthenticationPrincipal OidcUser principal,
            Authentication authentication) {

        if (principal == null) {
            log.debug("No authenticated user found");
            return ResponseEntity.status(401).body(Map.of(
                    "authenticated", false,
                    "error", "Not authenticated"
            ));
        }

        Map<String, Object> userInfo = new HashMap<>();

        // Basic user info from OIDC claims
        userInfo.put("authenticated", true);
        userInfo.put("id", principal.getSubject());
        userInfo.put("username", principal.getPreferredUsername());
        userInfo.put("email", principal.getEmail());
        userInfo.put("fullName", principal.getFullName());
        userInfo.put("givenName", principal.getGivenName());
        userInfo.put("familyName", principal.getFamilyName());

        // Extract agency_code from claims (custom Keycloak attribute)
        Object agencyCode = principal.getClaim("agency_code");
        userInfo.put("agencyCode", agencyCode);

        // Get roles from Spring Security authorities
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5)) // Remove ROLE_ prefix
                .collect(Collectors.toList());

        userInfo.put("roles", roles);

        // Determine primary role (highest priority)
        String primaryRole = determinePrimaryRole(roles);
        userInfo.put("role", primaryRole);

        log.debug("Returning user info for: {}", principal.getPreferredUsername());
        return ResponseEntity.ok(userInfo);
    }

    /**
     * Health check endpoint to verify authentication status.
     * Can be called by frontend to check if session is still valid.
     */
    @GetMapping("/auth/check")
    public ResponseEntity<Map<String, Object>> checkAuthentication(
            @AuthenticationPrincipal OidcUser principal) {

        if (principal == null) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", false
            ));
        }

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "username", principal.getPreferredUsername()
        ));
    }

    /**
     * Determines the primary role based on priority.
     * ADMIN > AUDITOR > AGENCY_USER > USER
     */
    private String determinePrimaryRole(List<String> roles) {
        if (roles.contains("ADMIN")) return "ADMIN";
        if (roles.contains("AUDITOR")) return "AUDITOR";
        if (roles.contains("AGENCY_USER")) return "AGENCY_USER";
        if (roles.contains("USER")) return "USER";
        return roles.isEmpty() ? "USER" : roles.get(0);
    }
}
