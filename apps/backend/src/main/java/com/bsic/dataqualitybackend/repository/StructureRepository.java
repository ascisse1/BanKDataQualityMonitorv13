package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.Structure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StructureRepository extends JpaRepository<Structure, Long> {

    Optional<Structure> findByCode(String code);
}
