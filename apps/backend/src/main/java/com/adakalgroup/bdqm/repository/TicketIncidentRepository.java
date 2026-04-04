package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.Ticket;
import com.adakalgroup.bdqm.model.TicketIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketIncidentRepository extends JpaRepository<TicketIncident, Long> {

    List<TicketIncident> findByTicket(Ticket ticket);

    List<TicketIncident> findByTicketId(Long ticketId);

    List<TicketIncident> findByIncidentType(String incidentType);

    List<TicketIncident> findByCategory(String category);

    List<TicketIncident> findByTicketIdAndResolved(Long ticketId, Boolean resolved);

    @Query("SELECT i FROM TicketIncident i WHERE i.ticket.id = :ticketId AND i.status = :status")
    List<TicketIncident> findByTicketIdAndStatus(@Param("ticketId") Long ticketId, @Param("status") String status);

    @Query("SELECT i FROM TicketIncident i WHERE i.ticket.id = :ticketId AND i.fieldName = :fieldName AND i.resolved = false ORDER BY i.createdAt DESC")
    Optional<TicketIncident> findOpenByTicketIdAndFieldName(@Param("ticketId") Long ticketId, @Param("fieldName") String fieldName);

    @Query("SELECT COUNT(i) FROM TicketIncident i WHERE i.ticket.id = :ticketId AND i.resolved = true")
    long countResolvedByTicketId(@Param("ticketId") Long ticketId);

    @Query("SELECT i.incidentType, COUNT(i) FROM TicketIncident i GROUP BY i.incidentType")
    List<Object[]> countByIncidentType();

    @Query("SELECT i.category, COUNT(i) FROM TicketIncident i GROUP BY i.category")
    List<Object[]> countByCategory();
}
