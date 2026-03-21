package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {

    List<TicketHistory> findByTicketId(Long ticketId);

    List<TicketHistory> findByTicketIdOrderByTimestampDesc(Long ticketId);

    List<TicketHistory> findByPerformedById(Integer userId);

    @Query("SELECT h FROM TicketHistory h WHERE h.ticket.id = :ticketId AND h.action = :action ORDER BY h.timestamp DESC")
    List<TicketHistory> findByTicketIdAndAction(@Param("ticketId") Long ticketId, @Param("action") String action);

    @Query("SELECT h FROM TicketHistory h WHERE h.timestamp BETWEEN :startDate AND :endDate ORDER BY h.timestamp DESC")
    List<TicketHistory> findHistoryBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(h) FROM TicketHistory h WHERE h.ticket.id = :ticketId")
    long countByTicketId(@Param("ticketId") Long ticketId);
}
