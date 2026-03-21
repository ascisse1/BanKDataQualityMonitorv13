package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

    List<TicketComment> findByTicketId(Long ticketId);

    List<TicketComment> findByTicketIdOrderByCreatedAtDesc(Long ticketId);

    List<TicketComment> findByUserId(Integer userId);

    @Query("SELECT c FROM TicketComment c WHERE c.ticket.id = :ticketId AND c.isInternal = :isInternal ORDER BY c.createdAt DESC")
    List<TicketComment> findByTicketIdAndInternal(@Param("ticketId") Long ticketId, @Param("isInternal") Boolean isInternal);

    @Query("SELECT COUNT(c) FROM TicketComment c WHERE c.ticket.id = :ticketId")
    long countByTicketId(@Param("ticketId") Long ticketId);
}
