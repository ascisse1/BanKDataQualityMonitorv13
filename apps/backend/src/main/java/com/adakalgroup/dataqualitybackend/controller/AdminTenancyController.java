package com.adakalgroup.dataqualitybackend.controller;

import com.adakalgroup.dataqualitybackend.dto.*;
import com.adakalgroup.dataqualitybackend.model.AppProfile;
import com.adakalgroup.dataqualitybackend.model.Structure;
import com.adakalgroup.dataqualitybackend.model.User;
import com.adakalgroup.dataqualitybackend.model.UserProfile;
import com.adakalgroup.dataqualitybackend.model.enums.UserProfileStatus;
import com.adakalgroup.dataqualitybackend.repository.AppProfileRepository;
import com.adakalgroup.dataqualitybackend.repository.StructureRepository;
import com.adakalgroup.dataqualitybackend.repository.UserProfileRepository;
import com.adakalgroup.dataqualitybackend.repository.UserRepository;
import com.adakalgroup.dataqualitybackend.service.keycloak.KeycloakAdminService;
import com.adakalgroup.dataqualitybackend.service.keycloak.KeycloakGroupSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/tenancy")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTenancyController {

    private final StructureRepository structureRepository;
    private final AppProfileRepository appProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final KeycloakGroupSyncService keycloakGroupSyncService;
    private final KeycloakAdminService keycloakAdminService;

    // ── Structures ──────────────────────────────────────────────

    @GetMapping("/structures")
    public ResponseEntity<ApiResponse<List<StructureDto>>> getAllStructures() {
        List<StructureDto> structures = structureRepository.findAll().stream()
                .map(this::mapStructure)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(structures));
    }

    @GetMapping("/structures/{id}")
    public ResponseEntity<ApiResponse<StructureDto>> getStructure(@PathVariable Long id) {
        Structure s = structureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Structure not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(mapStructure(s)));
    }

    @PostMapping("/structures")
    public ResponseEntity<ApiResponse<StructureDto>> createStructure(@RequestBody StructureDto dto) {
        Structure s = Structure.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .type(dto.getType() != null ? dto.getType() : "AGENCY")
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .build();
        if (dto.getParentId() != null) {
            s.setParent(structureRepository.findById(dto.getParentId()).orElse(null));
        }
        Structure saved = structureRepository.save(s);
        log.info("Created structure: {} ({})", saved.getCode(), saved.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Structure created", mapStructure(saved)));
    }

    @PutMapping("/structures/{id}")
    public ResponseEntity<ApiResponse<StructureDto>> updateStructure(@PathVariable Long id, @RequestBody StructureDto dto) {
        Structure s = structureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Structure not found: " + id));
        if (dto.getName() != null) s.setName(dto.getName());
        if (dto.getType() != null) s.setType(dto.getType());
        if (dto.getStatus() != null) s.setStatus(dto.getStatus());
        if (dto.getParentId() != null) {
            s.setParent(structureRepository.findById(dto.getParentId()).orElse(null));
        }
        Structure saved = structureRepository.save(s);
        return ResponseEntity.ok(ApiResponse.success("Structure updated", mapStructure(saved)));
    }

    // ── Keycloak Sync ─────────────────────────────────────────────

    @PostMapping("/sync-keycloak")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> syncKeycloak() {
        log.info("Admin triggered Keycloak group sync");
        java.util.Map<String, Object> result = keycloakGroupSyncService.syncAllProfiles();
        return ResponseEntity.ok(ApiResponse.success("Keycloak sync completed", result));
    }

    // ── App Profiles ────────────────────────────────────────────

    @GetMapping("/profiles")
    public ResponseEntity<ApiResponse<List<AppProfileDto>>> getAllProfiles() {
        List<AppProfileDto> profiles = appProfileRepository.findAll().stream()
                .map(this::mapProfile)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    @PostMapping("/profiles")
    public ResponseEntity<ApiResponse<AppProfileDto>> createProfile(@RequestBody AppProfileDto dto) {
        AppProfile p = AppProfile.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .build();
        AppProfile saved = appProfileRepository.save(p);

        // Create corresponding Keycloak group
        keycloakGroupSyncService.ensureKeycloakGroup(saved);

        log.info("Created app profile: {} ({})", saved.getCode(), saved.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile created", mapProfile(saved)));
    }

    @PutMapping("/profiles/{id}")
    public ResponseEntity<ApiResponse<AppProfileDto>> updateProfile(@PathVariable Long id, @RequestBody AppProfileDto dto) {
        AppProfile p = appProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + id));
        if (dto.getName() != null) p.setName(dto.getName());
        if (dto.getDescription() != null) p.setDescription(dto.getDescription());
        if (dto.getStatus() != null) p.setStatus(dto.getStatus());
        AppProfile saved = appProfileRepository.save(p);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", mapProfile(saved)));
    }

    /**
     * Returns the Keycloak roles mapped to a profile's group.
     * Roles are managed in Keycloak Admin Console; this is read-only.
     */
    @GetMapping("/profiles/{id}/roles")
    public ResponseEntity<ApiResponse<List<String>>> getProfileRoles(@PathVariable Long id) {
        AppProfile profile = appProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + id));

        if (profile.getKeycloakGroupId() == null) {
            // Try to create/link the group
            keycloakGroupSyncService.ensureKeycloakGroup(profile);
        }

        if (profile.getKeycloakGroupId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }

        List<String> roles = keycloakAdminService.getGroupRealmRoles(profile.getKeycloakGroupId())
                .stream()
                .map(r -> r.getName())
                .sorted()
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    // ── User Profiles (Assignments) ─────────────────────────────

    @GetMapping("/user-profiles")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getAllUserProfiles(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Long structureId) {
        List<UserProfile> profiles;
        if (userId != null) {
            profiles = userProfileRepository.findByUserId(userId);
        } else {
            profiles = userProfileRepository.findAll();
        }

        List<UserProfileDto> dtos = profiles.stream()
                .filter(up -> structureId == null || up.getStructure().getId().equals(structureId))
                .map(this::mapUserProfile)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping("/user-profiles")
    public ResponseEntity<ApiResponse<UserProfileDto>> createUserProfile(
            @Valid @RequestBody CreateUserProfileRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUserId()));
        Structure structure = structureRepository.findById(request.getStructureId())
                .orElseThrow(() -> new IllegalArgumentException("Structure not found: " + request.getStructureId()));

        AppProfile profile = null;
        if (request.getProfileId() != null) {
            profile = appProfileRepository.findById(request.getProfileId())
                    .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + request.getProfileId()));
        }

        // Check if assignment already exists for same (user, structure, profile, dateFrom)
        Long profileId = profile != null ? profile.getId() : null;
        var existing = userProfileRepository.findByUserIdAndStructureIdAndProfileIdAndDateFrom(
                request.getUserId(), request.getStructureId(), profileId, request.getDateFrom());

        UserProfile saved;
        if (existing.isPresent()) {
            // Reactivate existing assignment
            saved = existing.get();
            saved.setStatus(UserProfileStatus.ACTIVE);
            saved.setDateTo(request.getDateTo());
            saved = userProfileRepository.save(saved);
            log.info("Reactivated user profile: user={} structure={}", user.getUsername(), structure.getCode());
        } else {
            UserProfile up = UserProfile.builder()
                    .user(user)
                    .structure(structure)
                    .profile(profile)
                    .dateFrom(request.getDateFrom())
                    .dateTo(request.getDateTo())
                    .status(UserProfileStatus.ACTIVE)
                    .build();
            saved = userProfileRepository.save(up);
            log.info("Created user profile: user={} structure={}", user.getUsername(), structure.getCode());
        }

        // Sync to Keycloak: add user to profile's group
        keycloakGroupSyncService.onUserProfileAssigned(saved);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User assignment created", mapUserProfile(saved)));
    }

    @PutMapping("/user-profiles/{id}")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateUserProfile(
            @PathVariable Long id, @RequestBody UserProfileDto dto) {
        UserProfile up = userProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found: " + id));

        if (dto.getDateFrom() != null) up.setDateFrom(dto.getDateFrom());
        if (dto.getDateTo() != null) up.setDateTo(dto.getDateTo());
        if (dto.getStatus() != null) up.setStatus(UserProfileStatus.valueOf(dto.getStatus()));
        if (dto.getProfileId() != null) {
            up.setProfile(appProfileRepository.findById(dto.getProfileId()).orElse(null));
        }

        UserProfile saved = userProfileRepository.save(up);
        return ResponseEntity.ok(ApiResponse.success("User assignment updated", mapUserProfile(saved)));
    }

    @DeleteMapping("/user-profiles/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateUserProfile(@PathVariable Long id) {
        UserProfile up = userProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found: " + id));
        up.setStatus(UserProfileStatus.INACTIVE);
        up.setDateTo(LocalDate.now());
        userProfileRepository.save(up);
        log.info("Deactivated user profile: id={}", id);

        // Sync to Keycloak: remove user from profile's group
        keycloakGroupSyncService.onUserProfileDeactivated(up);

        return ResponseEntity.ok(ApiResponse.success("User assignment deactivated", null));
    }

    // ── Mappers ─────────────────────────────────────────────────

    private StructureDto mapStructure(Structure s) {
        return StructureDto.builder()
                .id(s.getId())
                .code(s.getCode())
                .name(s.getName())
                .type(s.getType())
                .parentId(s.getParent() != null ? s.getParent().getId() : null)
                .parentName(s.getParent() != null ? s.getParent().getName() : null)
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private AppProfileDto mapProfile(AppProfile p) {
        return AppProfileDto.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .description(p.getDescription())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private UserProfileDto mapUserProfile(UserProfile up) {
        return UserProfileDto.builder()
                .id(up.getId())
                .dateFrom(up.getDateFrom())
                .dateTo(up.getDateTo())
                .status(up.getStatus().name())
                .userId(up.getUser().getId())
                .username(up.getUser().getUsername())
                .userFullName(up.getUser().getFullName())
                .profileId(up.getProfile() != null ? up.getProfile().getId() : null)
                .profileCode(up.getProfile() != null ? up.getProfile().getCode() : null)
                .profileName(up.getProfile() != null ? up.getProfile().getName() : null)
                .structureId(up.getStructure().getId())
                .structureCode(up.getStructure().getCode())
                .structureName(up.getStructure().getName())
                .createdAt(up.getCreatedAt())
                .updatedAt(up.getUpdatedAt())
                .build();
    }
}
