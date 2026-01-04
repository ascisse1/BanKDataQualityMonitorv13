package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.TicketIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketIncidentRepository extends JpaRepository<TicketIncident, Long> {

    List<TicketIncident> findByTicketId(Long ticketId);

    List<TicketIncident> findByIncidentType(String incidentType);

    List<TicketIncident> findByCategory(String category);

    List<TicketIncident> findByTicketIdAndResolved(Long ticketId, Boolean resolved);

    @Query("SELECT i FROM TicketIncident i WHERE i.ticket.id = :ticketId AND i.status = :status")
    List<TicketIncident> findByTicketIdAndStatus(@Param("ticketId") Long ticketId, @Param("status") String status);

    @Query("SELECT COUNT(i) FROM TicketIncident i WHERE i.ticket.id = :ticketId AND i.resolved = true")
    long countResolvedByTicketId(@Param("ticketId") Long ticketId);

    @Query("SELECT i.incidentType, COUNT(i) FROM TicketIncident i GROUP BY i.incidentType")
    List<Object[]> countByIncidentType();

    @Query("SELECT i.category, COUNT(i) FROM TicketIncident i GROUP BY i.category")
    List<Object[]> countByCategory();
}
