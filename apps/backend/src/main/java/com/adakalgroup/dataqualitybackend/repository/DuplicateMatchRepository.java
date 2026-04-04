package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.DuplicateMatch;
import com.adakalgroup.dataqualitybackend.model.enums.DuplicateMatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DuplicateMatchRepository extends JpaRepository<DuplicateMatch, Long> {

    List<DuplicateMatch> findByStatus(DuplicateMatchStatus status);

    List<DuplicateMatch> findByStatusAndClientType(DuplicateMatchStatus status, String clientType);

    List<DuplicateMatch> findByClientType(String clientType);

    List<DuplicateMatch> findBySimilarityScoreGreaterThanEqualAndClientType(double minScore, String clientType);

    List<DuplicateMatch> findBySimilarityScoreGreaterThanEqual(double minScore);

    long countByStatus(DuplicateMatchStatus status);

    long countByClientType(String clientType);

    long countByStatusAndClientType(DuplicateMatchStatus status, String clientType);

    long countBySimilarityScoreGreaterThanEqual(double minScore);

    boolean existsByClientId1AndClientId2(String clientId1, String clientId2);

    Optional<DuplicateMatch> findByClientId1AndClientId2(String clientId1, String clientId2);
}
