package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.dto.UserDto;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDto> userDtos = users.stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(userDtos));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Integer id) {
        User user = userService.getUserById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        UserDto userDto = mapToUserDto(user);
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @GetMapping("/agency/{agencyCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsersByAgency(@PathVariable String agencyCode) {
        List<User> users = userService.getUsersByAgency(agencyCode);
        List<UserDto> userDtos = users.stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(userDtos));
    }

    @GetMapping("/agency/{agencyCode}/active")
    public ResponseEntity<ApiResponse<List<UserDto>>> getActiveAgencyUsers(@PathVariable String agencyCode) {
        List<User> users = userService.getActiveAgencyUsers(agencyCode);
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

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .agencyCode(user.getAgencyCode())
                .status(user.getStatus())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
