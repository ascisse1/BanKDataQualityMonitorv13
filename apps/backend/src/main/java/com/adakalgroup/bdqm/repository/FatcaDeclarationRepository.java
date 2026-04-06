package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.FatcaDeclaration;
import com.adakalgroup.bdqm.model.enums.DeclarationStatus;
import com.adakalgroup.bdqm.model.enums.DeclarationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FatcaDeclarationRepository extends JpaRepository<FatcaDeclaration, Long> {

    Page<FatcaDeclaration> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<FatcaDeclaration> findByReportingYear(int year);

    Optional<FatcaDeclaration> findByMessageRefId(String messageRefId);

    List<FatcaDeclaration> findByStatus(DeclarationStatus status);

    long countByReportingYearAndDeclarationType(int year, DeclarationType type);
}
