package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.FatcaAuditLog;
import com.bsic.dataqualitybackend.repository.FatcaAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FatcaAuditService {

    private final FatcaAuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logStatusChange(String cli, String previousStatus, String newStatus, String performedBy, String notes) {
        FatcaAuditLog auditLog = FatcaAuditLog.builder()
            .cli(cli)
            .action("STATUS_CHANGE")
            .previousStatus(previousStatus)
            .newStatus(newStatus)
            .performedBy(performedBy)
            .notes(notes)
            .build();
        auditLogRepository.save(auditLog);
        log.debug("FATCA audit: status change for client {} from {} to {} by {}", cli, previousStatus, newStatus, performedBy);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAutoDetection(String cli, String indiciaType, String notes) {
        FatcaAuditLog auditLog = FatcaAuditLog.builder()
            .cli(cli)
            .action("AUTO_DETECTION")
            .newStatus("PENDING_REVIEW")
            .performedBy("SYSTEM")
            .notes(indiciaType + (notes != null ? " - " + notes : ""))
            .build();
        auditLogRepository.save(auditLog);
        log.debug("FATCA audit: auto-detection for client {} - indicia: {}", cli, indiciaType);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logReview(String cli, String action, String performedBy, String notes) {
        FatcaAuditLog auditLog = FatcaAuditLog.builder()
            .cli(cli)
            .action(action)
            .performedBy(performedBy)
            .notes(notes)
            .build();
        auditLogRepository.save(auditLog);
        log.debug("FATCA audit: {} for client {} by {}", action, cli, performedBy);
    }

    public Page<FatcaAuditLog> getAuditHistory(String cli, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return auditLogRepository.findByCli(cli, pageable);
    }

    public Page<FatcaAuditLog> getAuditByUser(String performedBy, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return auditLogRepository.findByPerformedBy(performedBy, pageable);
    }
}
