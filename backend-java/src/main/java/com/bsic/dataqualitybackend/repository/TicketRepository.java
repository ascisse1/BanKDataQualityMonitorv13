package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.enums.TicketPriority;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    List<Ticket> findByCli(String cli);

    Page<Ticket> findByAgencyCode(String agencyCode, Pageable pageable);

    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    Page<Ticket> findByPriority(TicketPriority priority, Pageable pageable);

    Page<Ticket> findByAgencyCodeAndStatus(String agencyCode, TicketStatus status, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.assignedTo.id = :userId")
    Page<Ticket> findByAssignedUserId(@Param("userId") Integer userId, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.assignedTo.id = :userId AND t.status = :status")
    Page<Ticket> findByAssignedUserIdAndStatus(@Param("userId") Integer userId, @Param("status") TicketStatus status, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.slaDeadline < :now AND t.status NOT IN ('CLOSED', 'REJECTED')")
    List<Ticket> findOverdueSlaTickets(@Param("now") LocalDateTime now);

    @Query("SELECT t FROM Ticket t WHERE t.slaDeadline BETWEEN :start AND :end AND t.status NOT IN ('CLOSED', 'REJECTED')")
    List<Ticket> findTicketsNearSlaDeadline(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.agencyCode = :agencyCode AND t.status = :status")
    long countByAgencyCodeAndStatus(@Param("agencyCode") String agencyCode, @Param("status") TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.assignedTo.id = :userId AND t.status = :status")
    long countByAssignedUserIdAndStatus(@Param("userId") Integer userId, @Param("status") TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.slaBreached = true AND t.status NOT IN ('CLOSED', 'REJECTED')")
    long countSlaBreachedTickets();

    @Query("SELECT t.agencyCode, COUNT(t) FROM Ticket t WHERE t.status = :status GROUP BY t.agencyCode")
    List<Object[]> countTicketsByAgencyAndStatus(@Param("status") TicketStatus status);

    @Query("SELECT t FROM Ticket t WHERE t.createdAt BETWEEN :startDate AND :endDate")
    List<Ticket> findTicketsCreatedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
