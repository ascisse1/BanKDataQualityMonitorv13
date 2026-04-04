package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.Correction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorrectionRepository extends JpaRepository<Correction, Long> {

    List<Correction> findByTicketId(String ticketId);

    List<Correction> findByTicketIdAndIsMatchedFalse(String ticketId);

    List<Correction> findByTicketIdAndFieldName(String ticketId, String fieldName);
}
