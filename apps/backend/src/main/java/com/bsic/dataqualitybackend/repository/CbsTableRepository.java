package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.CbsTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CbsTableRepository extends JpaRepository<CbsTable, Long> {

    Optional<CbsTable> findByTableName(String tableName);

    List<CbsTable> findByActiveTrue();

    List<CbsTable> findBySyncEnabledTrueAndActiveTrueOrderBySyncOrderAsc();
}
