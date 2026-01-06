package com.bsic.dataqualitybackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Security configuration using OAuth2 Client (BFF pattern).
 *
 * This is the MOST SECURE approach for SPAs:
 * - Tokens stored server-side in session
 * - Frontend uses HttpOnly session cookies
 * - No tokens exposed to JavaScript (XSS-safe)
 * - CSRF protection enabled
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;
    private final PasswordEncoder passwordEncoder;
    private final UserDetailsService userDetailsService;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("${keycloak.auth-server-url:http://localhost:9083}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm:bsic-bank}")
    private String realm;

    private static final String ROLE_PREFIX = "ROLE_";

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF protection for session-based auth
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/assets/**",
                                "/favicon.ico",
                                "/logo-*.png",
                                "/actuator/health/**",
                                "/camunda/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/login",
                                "/login/oauth2/code/**",        // OAuth2 callback endpoint - MUST be public
                                "/oauth2/authorization/**",     // OAuth2 authorization initiation
                                "/api/public/**",
                                "/api/auth-info",
                                "/api/me"                       // User info endpoint for auth check
                        ).permitAll()
                        // Role-based access
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/auditor/**").hasAnyRole("ADMIN", "AUDITOR")
                        .requestMatchers("/api/agency/**").hasAnyRole("ADMIN", "AGENCY_USER")
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )

                // OAuth2 Login configuration
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/oauth2/authorization/keycloak")
                        .userInfoEndpoint(userInfo -> userInfo
                                .userAuthoritiesMapper(userAuthoritiesMapper())
                        )
                        .defaultSuccessUrl("/", true)
                )

                // Logout configuration with Keycloak
                .logout(logout -> logout
                        .logoutSuccessHandler(oidcLogoutSuccessHandler())
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID")
                );

        return http.build();
    }

    /**
     * OIDC logout handler - redirects to Keycloak end_session_endpoint.
     */
    @Bean
    public LogoutSuccessHandler oidcLogoutSuccessHandler() {
        OidcClientInitiatedLogoutSuccessHandler handler =
                new OidcClientInitiatedLogoutSuccessHandler(clientRegistrationRepository);
        handler.setPostLogoutRedirectUri("{baseUrl}");
        return handler;
    }

    /**
     * Maps Keycloak roles to Spring Security authorities.
     */
    @Bean
    public GrantedAuthoritiesMapper userAuthoritiesMapper() {
        return authorities -> {
            Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

            authorities.forEach(authority -> {
                if (authority instanceof OidcUserAuthority oidcAuthority) {
                    extractAuthorities(oidcAuthority.getIdToken().getClaims(), mappedAuthorities);
                    extractAuthorities(oidcAuthority.getUserInfo().getClaims(), mappedAuthorities);
                } else if (authority instanceof OAuth2UserAuthority oauth2Authority) {
                    extractAuthorities(oauth2Authority.getAttributes(), mappedAuthorities);
                }
            });

            return mappedAuthorities;
        };
    }

    /**
     * Extracts authorities from Keycloak token claims.
     */
    private void extractAuthorities(Map<String, Object> claims, Set<GrantedAuthority> authorities) {
        // Extract from realm_access.roles
        Object realmAccess = claims.get("realm_access");
        if (realmAccess instanceof Map<?, ?> realmAccessMap) {
            Object roles = realmAccessMap.get("roles");
            if (roles instanceof Collection<?> rolesList) {
                rolesList.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .filter(this::isApplicationRole)
                        .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
                        .forEach(authorities::add);
            }
        }

        // Extract from groups claim
        Object groups = claims.get("groups");
        if (groups instanceof Collection<?> groupsList) {
            groupsList.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .filter(g -> g.startsWith(ROLE_PREFIX))
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);
        }
    }

    private boolean isApplicationRole(String role) {
        return role.equalsIgnoreCase("ADMIN") ||
                role.equalsIgnoreCase("AUDITOR") ||
                role.equalsIgnoreCase("AGENCY_USER") ||
                role.equalsIgnoreCase("USER");
    }

    /**
     * Authentication provider for legacy services (backward compatibility).
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
