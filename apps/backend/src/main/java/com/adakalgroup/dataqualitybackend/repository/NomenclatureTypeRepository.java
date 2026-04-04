package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.NomenclatureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NomenclatureTypeRepository extends JpaRepository<NomenclatureType, Long> {

    Optional<NomenclatureType> findByCtab(String ctab);

    List<NomenclatureType> findByActiveTrue();

    List<NomenclatureType> findBySyncEnabledTrueAndActiveTrue();
}
