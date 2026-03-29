package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    @Query("SELECT up FROM UserProfile up " +
           "JOIN FETCH up.structure s " +
           "WHERE up.user.id = :userId " +
           "AND up.status = com.bsic.dataqualitybackend.model.enums.UserProfileStatus.ACTIVE " +
           "AND up.dateFrom <= :today " +
           "AND (up.dateTo IS NULL OR up.dateTo >= :today)")
    List<UserProfile> findActiveByUserId(@Param("userId") Integer userId, @Param("today") LocalDate today);

    List<UserProfile> findByUserId(Integer userId);

    @Query("SELECT up FROM UserProfile up " +
           "JOIN FETCH up.user u " +
           "WHERE up.structure.code = :structureCode " +
           "AND up.status = com.bsic.dataqualitybackend.model.enums.UserProfileStatus.ACTIVE " +
           "AND up.dateFrom <= :today " +
           "AND (up.dateTo IS NULL OR up.dateTo >= :today)")
    List<UserProfile> findActiveByStructureCode(@Param("structureCode") String structureCode, @Param("today") LocalDate today);

    Optional<UserProfile> findByUserIdAndStructureIdAndProfileIdAndDateFrom(
            Integer userId, Long structureId, Long profileId, LocalDate dateFrom);
}
