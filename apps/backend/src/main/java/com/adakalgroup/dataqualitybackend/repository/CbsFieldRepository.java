package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.CbsField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CbsFieldRepository extends JpaRepository<CbsField, Long> {

    List<CbsField> findByCbsTableIdAndActiveTrueOrderByDisplayOrderAsc(Long tableId);

    List<CbsField> findByCbsTableTableNameAndActiveTrue(String tableName);

    Optional<CbsField> findByCbsTableTableNameAndColumnName(String tableName, String columnName);

    List<CbsField> findByNomenclatureCtabNotNull();

    List<CbsField> findByCbsTableTableNameAndIsUpdatableTrue(String tableName);

    List<CbsField> findByCbsTableTableNameAndIsRequiredTrue(String tableName);

    @Query("SELECT f FROM CbsField f WHERE f.cbsTable.tableName = :tableName AND f.nomenclatureCtab = :ctab")
    List<CbsField> findByTableAndNomenclature(@Param("tableName") String tableName, @Param("ctab") String ctab);

    long countByCbsTableIdAndActiveTrue(Long tableId);
}
