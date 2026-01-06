package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.Agency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, Long> {

    Optional<Agency> findByCode(String code);

    List<Agency> findByRegion(String region);

    List<Agency> findByActive(Boolean active);

    List<Agency> findByActiveOrderByNameAsc(Boolean active);

    boolean existsByCode(String code);
}
