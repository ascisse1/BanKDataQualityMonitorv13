package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.FatcaAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FatcaAuditLogRepository extends JpaRepository<FatcaAuditLog, Integer> {

    Page<FatcaAuditLog> findByCli(String cli, Pageable pageable);

    Page<FatcaAuditLog> findByPerformedBy(String performedBy, Pageable pageable);

    Page<FatcaAuditLog> findByAction(String action, Pageable pageable);

    List<FatcaAuditLog> findByCliOrderByCreatedAtDesc(String cli);

    long countByAction(String action);
}
