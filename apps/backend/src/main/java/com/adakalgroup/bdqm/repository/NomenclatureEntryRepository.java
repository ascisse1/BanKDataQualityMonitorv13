package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.NomenclatureEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NomenclatureEntryRepository extends JpaRepository<NomenclatureEntry, Long> {

    List<NomenclatureEntry> findByCtabAndActiveTrue(String ctab);

    Optional<NomenclatureEntry> findByCtabAndCaccAndAge(String ctab, String cacc, String age);

    List<NomenclatureEntry> findByCtabAndCaccContainingIgnoreCase(String ctab, String search);

    @Query("SELECT e FROM NomenclatureEntry e WHERE e.ctab = :ctab AND e.cacc = :cacc AND (e.age = :age OR e.age = '00000')")
    List<NomenclatureEntry> findByCtabAndCaccWithFallback(@Param("ctab") String ctab, @Param("cacc") String cacc, @Param("age") String age);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM NomenclatureEntry e WHERE e.ctab = :ctab AND e.cacc = :cacc AND e.active = true")
    boolean existsValidEntry(@Param("ctab") String ctab, @Param("cacc") String cacc);

    long countByCtabAndActiveTrue(String ctab);

    @Modifying
    @Query("DELETE FROM NomenclatureEntry e WHERE e.ctab = :ctab")
    void deleteAllByCtab(@Param("ctab") String ctab);
}
