package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.TicketDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketDocumentRepository extends JpaRepository<TicketDocument, Long> {

    List<TicketDocument> findByTicketId(Long ticketId);

    List<TicketDocument> findByUploadedById(Integer userId);

    @Query("SELECT d FROM TicketDocument d WHERE d.ticket.id = :ticketId ORDER BY d.uploadedAt DESC")
    List<TicketDocument> findByTicketIdOrderByUploadedAtDesc(@Param("ticketId") Long ticketId);

    @Query("SELECT COUNT(d) FROM TicketDocument d WHERE d.ticket.id = :ticketId")
    long countByTicketId(@Param("ticketId") Long ticketId);
}
