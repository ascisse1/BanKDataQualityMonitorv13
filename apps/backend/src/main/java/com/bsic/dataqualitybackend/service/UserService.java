package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.enums.UserRole;
import com.bsic.dataqualitybackend.model.enums.UserStatus;
import com.bsic.dataqualitybackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public User createUser(User user) {
        log.info("Creating new user: {}", user.getUsername());

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + user.getUsername());
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + user.getEmail());
        }

        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByAgency(String agencyCode) {
        return userRepository.findByAgencyCode(agencyCode);
    }

    public List<User> getActiveAgencyUsers(String agencyCode) {
        return userRepository.findActiveAgencyUsers(agencyCode);
    }

    @Transactional
    public User updateUser(Integer id, User updatedUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (updatedUser.getFullName() != null) {
            user.setFullName(updatedUser.getFullName());
        }
        if (updatedUser.getEmail() != null && !updatedUser.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updatedUser.getEmail())) {
                throw new IllegalArgumentException("Email already exists: " + updatedUser.getEmail());
            }
            user.setEmail(updatedUser.getEmail());
        }
        if (updatedUser.getRole() != null) {
            user.setRole(updatedUser.getRole());
        }
        if (updatedUser.getDepartment() != null) {
            user.setDepartment(updatedUser.getDepartment());
        }
        if (updatedUser.getAgencyCode() != null) {
            user.setAgencyCode(updatedUser.getAgencyCode());
        }
        if (updatedUser.getStatus() != null) {
            user.setStatus(updatedUser.getStatus());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void updateLastLogin(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
        });
    }

    @Transactional
    public void incrementFailedLoginAttempts(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            userRepository.save(user);
        });
    }

    @Transactional
    public void changePassword(Integer userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed for user: {}", user.getUsername());
    }

    @Transactional
    public void deleteUser(Integer id) {
        userRepository.deleteById(id);
        log.info("User deleted: {}", id);
    }

    public long countActiveUsers() {
        return userRepository.countActiveUsers();
    }

    @Transactional
    public User syncFromOidc(OidcUser principal, List<String> roles) {
        String keycloakId = principal.getSubject();
        String username = principal.getPreferredUsername();

        // Try to find by keycloakId first, then by username (migration path)
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseGet(() -> userRepository.findByUsername(username)
                        .orElse(null));

        boolean isNew = (user == null);

        if (isNew) {
            user = User.builder()
                    .username(username)
                    .email(principal.getEmail())
                    .keycloakId(keycloakId)
                    .status(UserStatus.ACTIVE)
                    .failedLoginAttempts(0)
                    .build();
            log.info("Creating new user from Keycloak: {}", username);
        } else {
            // Link existing user to Keycloak if not already linked
            if (user.getKeycloakId() == null) {
                user.setKeycloakId(keycloakId);
                log.info("Linking existing user {} to Keycloak ID {}", username, keycloakId);
            }
        }

        // Update fields from OIDC token
        user.setEmail(principal.getEmail());
        user.setFullName(principal.getFullName());
        user.setRole(determinePrimaryRole(roles));
        user.setLastLogin(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        user.setStatus(UserStatus.ACTIVE);

        // Sync agency_code from custom claim
        Object agencyCode = principal.getClaim("agency_code");
        if (agencyCode != null) {
            user.setAgencyCode(agencyCode.toString());
        }

        return userRepository.save(user);
    }

    private UserRole determinePrimaryRole(List<String> roles) {
        if (roles.contains("ADMIN")) return UserRole.ADMIN;
        if (roles.contains("AUDITOR")) return UserRole.AUDITOR;
        if (roles.contains("AGENCY_USER")) return UserRole.AGENCY_USER;
        return UserRole.USER;
    }
}
