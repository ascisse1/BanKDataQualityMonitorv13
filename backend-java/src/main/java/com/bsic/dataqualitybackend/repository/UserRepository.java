package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.enums.UserRole;
import com.bsic.dataqualitybackend.model.enums.UserStatus;
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

    Optional<User> findByLdapDn(String ldapDn);

    List<User> findByRole(UserRole role);

    List<User> findByAgencyCode(String agencyCode);

    List<User> findByStatus(UserStatus status);

    List<User> findByRoleAndAgencyCode(UserRole role, String agencyCode);

    @Query("SELECT u FROM User u WHERE u.agencyCode = :agencyCode AND u.status = 'ACTIVE' AND u.role = 'AGENCY_USER'")
    List<User> findActiveAgencyUsers(@Param("agencyCode") String agencyCode);

    @Query("SELECT u FROM User u WHERE u.department = :department AND u.status = 'ACTIVE'")
    List<User> findActiveUsersByDepartment(@Param("department") String department);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status = 'ACTIVE'")
    long countActiveUsers();
}
