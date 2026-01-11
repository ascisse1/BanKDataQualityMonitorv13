package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.Agency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, String> {

    Optional<Agency> findByAge(String age);

    List<Agency> findAllByOrderByLibAsc();

    boolean existsByAge(String age);
}
