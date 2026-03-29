package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.dto.UserDto;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.UserProfile;
import com.bsic.dataqualitybackend.model.enums.UserRole;
import com.bsic.dataqualitybackend.model.enums.UserStatus;
import com.bsic.dataqualitybackend.repository.UserProfileRepository;
import com.bsic.dataqualitybackend.repository.UserRepository;
import com.bsic.dataqualitybackend.service.UserService;
import com.bsic.dataqualitybackend.service.keycloak.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDto> userDtos = users.stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(userDtos));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats() {
        List<User> allUsers = userService.getAllUsers();
        long total = allUsers.size();
        long active = allUsers.stream().filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long admins = allUsers.stream().filter(u -> u.getRole() == UserRole.ADMIN).count();
        long agencyUsers = allUsers.stream().filter(u -> u.getRole() == UserRole.AGENCY_USER).count();
        long recentLogins = allUsers.stream()
                .filter(u -> u.getLastLogin() != null && u.getLastLogin().isAfter(LocalDateTime.now().minusDays(7)))
                .count();

        // Count distinct structures with active user profiles
        long agenciesWithUsers = userProfileRepository.findAll().stream()
                .filter(up -> up.getStatus() == com.bsic.dataqualitybackend.model.enums.UserProfileStatus.ACTIVE)
                .map(up -> up.getStructure().getCode())
                .distinct()
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("active", active);
        stats.put("admins", admins);
        stats.put("agency_users", agencyUsers);
        stats.put("recent_logins", recentLogins);
        stats.put("agencies_with_users", agenciesWithUsers);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Integer id) {
        User user = userService.getUserById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        UserDto userDto = mapToUserDto(user);
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @GetMapping("/agency/{structureCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsersByAgency(@PathVariable String structureCode) {
        List<User> users = userProfileRepository.findActiveByStructureCode(structureCode, LocalDate.now())
                .stream()
                .map(UserProfile::getUser)
                .distinct()
                .toList();
        List<UserDto> userDtos = users.stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(userDtos));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        UserDto userDto = mapToUserDto(createdUser);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", userDto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable Integer id, @RequestBody User user) {
        User updatedUser = userService.updateUser(id, user);
        UserDto userDto = mapToUserDto(updatedUser);

        return ResponseEntity.ok(ApiResponse.success("User updated successfully", userDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @PostMapping("/sync-keycloak")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncFromKeycloak() {
        log.info("Admin triggered Keycloak user sync");

        List<UserRepresentation> kcUsers = keycloakAdminService.getAllRealmUsers();
        int created = 0;
        int updated = 0;
        int skipped = 0;

        for (UserRepresentation kcUser : kcUsers) {
            if (kcUser.getUsername() == null) {
                skipped++;
                continue;
            }

            try {
                User existingByKcId = kcUser.getId() != null
                        ? userRepository.findByKeycloakId(kcUser.getId()).orElse(null)
                        : null;
                User existingByUsername = userRepository.findByUsername(kcUser.getUsername()).orElse(null);
                User user = existingByKcId != null ? existingByKcId : existingByUsername;

                boolean isNew = (user == null);
                if (isNew) {
                    user = User.builder()
                            .username(kcUser.getUsername())
                            .email(kcUser.getEmail() != null ? kcUser.getEmail() : kcUser.getUsername() + "@unknown")
                            .keycloakId(kcUser.getId())
                            .status(kcUser.isEnabled() ? UserStatus.ACTIVE : UserStatus.INACTIVE)
                            .failedLoginAttempts(0)
                            .build();
                }

                user.setKeycloakId(kcUser.getId());
                user.setEmail(kcUser.getEmail() != null ? kcUser.getEmail() : user.getEmail());
                String fullName = buildFullName(kcUser.getFirstName(), kcUser.getLastName());
                if (fullName != null) user.setFullName(fullName);
                user.setStatus(kcUser.isEnabled() ? UserStatus.ACTIVE : UserStatus.INACTIVE);

                // Determine role from Keycloak roles
                List<String> kcRoles = keycloakAdminService.getUserRealmRoles(kcUser.getId());
                user.setRole(determinePrimaryRole(kcRoles));

                userRepository.save(user);

                if (isNew) {
                    created++;
                    log.debug("Created user from Keycloak: {}", kcUser.getUsername());
                } else {
                    updated++;
                }
            } catch (Exception e) {
                log.warn("Failed to sync Keycloak user {}: {}", kcUser.getUsername(), e.getMessage());
                skipped++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("keycloakUsers", kcUsers.size());
        result.put("created", created);
        result.put("updated", updated);
        result.put("skipped", skipped);

        log.info("Keycloak user sync completed: {} created, {} updated, {} skipped",
                created, updated, skipped);
        return ResponseEntity.ok(ApiResponse.success("Keycloak user sync completed", result));
    }

    private String buildFullName(String firstName, String lastName) {
        if (firstName != null && lastName != null) return firstName + " " + lastName;
        if (firstName != null) return firstName;
        if (lastName != null) return lastName;
        return null;
    }

    private UserRole determinePrimaryRole(List<String> roles) {
        if (roles.stream().anyMatch(r -> r.contains("ADMIN"))) return UserRole.ADMIN;
        if (roles.stream().anyMatch(r -> r.contains("AUDITOR"))) return UserRole.AUDITOR;
        if (roles.stream().anyMatch(r -> r.contains("AGENCY_USER"))) return UserRole.AGENCY_USER;
        return UserRole.USER;
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .status(user.getStatus())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
