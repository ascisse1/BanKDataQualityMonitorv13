package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.User;
import com.adakalgroup.bdqm.model.enums.UserRole;
import com.adakalgroup.bdqm.model.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByKeycloakId(String keycloakId);

    List<User> findByRole(UserRole role);

    List<User> findByStatus(UserStatus status);

    @Query("SELECT u FROM User u WHERE u.department = :department AND u.status = 'ACTIVE'")
    List<User> findActiveUsersByDepartment(@Param("department") String department);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status = 'ACTIVE'")
    long countActiveUsers();
}
