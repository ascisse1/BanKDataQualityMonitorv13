package com.bsic.dataqualitybackend.dto;

import com.bsic.dataqualitybackend.model.enums.UserRole;
import com.bsic.dataqualitybackend.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Integer id;
    private String username;
    private String email;
    private String fullName;
    private UserRole role;
    private String department;
    private List<String> agencyCodes;
    private UserStatus status;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}
