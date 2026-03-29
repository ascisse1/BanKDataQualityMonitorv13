package com.bsic.dataqualitybackend.config;

import com.bsic.dataqualitybackend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.config.core.GrantedAuthorityDefaults;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfigurationSource;

import lombok.extern.slf4j.Slf4j;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.bsic.dataqualitybackend.security.SecurityUtils.ROLE_PREFIX;
import static com.bsic.dataqualitybackend.security.SecurityUtils.extractAuthorities;
import static org.springframework.security.oauth2.core.oidc.StandardClaimNames.PREFERRED_USERNAME;

/**
 * Security configuration using OAuth2 Client (BFF pattern).
 *
 * This is the MOST SECURE approach for SPAs:
 * - Tokens stored server-side in session
 * - Frontend uses HttpOnly session cookies
 * - No tokens exposed to JavaScript (XSS-safe)
 * - CSRF protection enabled
 */
@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("${keycloak.auth-server-url:http://localhost:9083}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm:bsic-bank}")
    private String realm;


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
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/login",
                                "/login/oauth2/code/**",        // OAuth2 callback endpoint - MUST be public
                                "/oauth2/authorization/**",     // OAuth2 authorization initiation
                                "/api/public/**",
                                "/api/auth-info",
                                "/api/me",                      // User info endpoint for auth check
                                "/api/monitoring/**"      // Frontend monitoring logs
                        ).permitAll()
                        // Role-based access
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/auditor/**").hasAnyRole("ADMIN", "AUDITOR")
                        .requestMatchers("/api/agency/**").hasAnyRole("ADMIN", "AGENCY_USER")
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 ->
                    oauth2.loginPage("/")
                        .userInfoEndpoint(userInfo -> userInfo.oidcUserService(this.oidcUserService())))

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
                    mappedAuthorities.addAll(SecurityUtils.extractAuthorityFromClaims(oidcAuthority.getUserInfo().getClaims()));
                } else if (authority instanceof OAuth2UserAuthority oauth2Authority) {
                    extractAuthorities(oauth2Authority.getAttributes(), mappedAuthorities);
                }
            });

            return mappedAuthorities;
        };
    }

    OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        final OidcUserService delegate = new OidcUserService();

        return userRequest -> {
            OidcUser oidcUser = delegate.loadUser(userRequest);
            return new DefaultOidcUser(oidcUser.getAuthorities(), oidcUser.getIdToken(), oidcUser.getUserInfo(), PREFERRED_USERNAME);
        };
    }


    /**
     * Configures Spring Security to use "BDQM:ROLE_" as the role prefix.
     * This means hasRole("ADMIN") will check for authority "BDQM:ROLE_ADMIN".
     * This ensures only BDQM-specific roles are matched, filtering out roles from other applications.
     */
    @Bean
    public GrantedAuthorityDefaults grantedAuthorityDefaults() {
        return new GrantedAuthorityDefaults(ROLE_PREFIX);
    }

}
