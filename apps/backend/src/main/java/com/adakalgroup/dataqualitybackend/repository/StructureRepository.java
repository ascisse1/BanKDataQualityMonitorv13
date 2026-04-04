package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.Structure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StructureRepository extends JpaRepository<Structure, Long> {

    Optional<Structure> findByCode(String code);

    List<Structure> findAllByOrderByNameAsc();

    List<Structure> findByTypeAndStatus(String type, String status);

    List<Structure> findByTypeAndStatusOrderByNameAsc(String type, String status);
}
