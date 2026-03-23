package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.*;
import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.TicketComment;
import com.bsic.dataqualitybackend.model.TicketHistory;
import com.bsic.dataqualitybackend.model.TicketIncident;
import com.bsic.dataqualitybackend.dto.TicketIncidentDto;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.enums.TicketPriority;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.security.SecurityUtils;
import com.bsic.dataqualitybackend.service.AuthenticationService;
import com.bsic.dataqualitybackend.service.TicketService;
import com.bsic.dataqualitybackend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final AuthenticationService authenticationService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<TicketDto>> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        String currentUsername = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));
        User currentUser = userService.getUserByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUsername));

        log.info("Creating ticket for client: {} by user: {}", request.getCli(), currentUsername);

        Ticket ticket = Ticket.builder()
                .cli(request.getCli())
                .agencyCode(request.getAgencyCode())
                .priority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM)
                .status(TicketStatus.DETECTED)
                .build();

        Ticket createdTicket = ticketService.createTicket(ticket, currentUser);
        TicketDto ticketDto = mapToTicketDto(createdTicket);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket créé avec succès", ticketDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketDto>> getTicketById(@PathVariable Long id) {
        Ticket ticket = ticketService.getTicketById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé: " + id));

        TicketDto ticketDto = mapToTicketDto(ticket);
        return ResponseEntity.ok(ApiResponse.success(ticketDto));
    }

    @GetMapping("/number/{ticketNumber}")
    public ResponseEntity<ApiResponse<TicketDto>> getTicketByNumber(@PathVariable String ticketNumber) {
        Ticket ticket = ticketService.getTicketByNumber(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketNumber));

        TicketDto ticketDto = mapToTicketDto(ticket);
        return ResponseEntity.ok(ApiResponse.success(ticketDto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TicketDto>>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Ticket> tickets = ticketService.getAllTickets(pageable);
        Page<TicketDto> ticketDtos = tickets.map(this::mapToTicketDto);

        return ResponseEntity.ok(ApiResponse.success(ticketDtos));
    }

    @GetMapping("/agency/{agencyCode}")
    public ResponseEntity<ApiResponse<Page<TicketDto>>> getTicketsByAgency(
            @PathVariable String agencyCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Ticket> tickets = ticketService.getTicketsByAgency(agencyCode, pageable);
        Page<TicketDto> ticketDtos = tickets.map(this::mapToTicketDto);

        return ResponseEntity.ok(ApiResponse.success(ticketDtos));
    }

    @GetMapping("/assigned-to-me")
    public ResponseEntity<ApiResponse<Page<TicketDto>>> getMyTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = authenticationService.getCurrentUser(authentication.getName());

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Ticket> tickets = ticketService.getTicketsByAssignedUser(currentUser.getId(), pageable);
        Page<TicketDto> ticketDtos = tickets.map(this::mapToTicketDto);

        return ResponseEntity.ok(ApiResponse.success(ticketDtos));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<TicketDto>> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = authenticationService.getCurrentUser(authentication.getName());

        Integer assignedToUserId = request.get("assignedToUserId");
        Ticket ticket = ticketService.assignTicket(id, assignedToUserId, currentUser.getId());

        TicketDto ticketDto = mapToTicketDto(ticket);
        return ResponseEntity.ok(ApiResponse.success("Ticket assigned successfully", ticketDto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TicketDto>> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = authenticationService.getCurrentUser(authentication.getName());

        TicketStatus newStatus = TicketStatus.valueOf((String) request.get("status"));
        String notes = (String) request.get("notes");

        Ticket ticket = ticketService.updateTicketStatus(id, newStatus, currentUser.getId(), notes);

        TicketDto ticketDto = mapToTicketDto(ticket);
        return ResponseEntity.ok(ApiResponse.success("Ticket status updated", ticketDto));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<Void>> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = authenticationService.getCurrentUser(authentication.getName());

        String comment = (String) request.get("comment");
        Boolean isInternal = (Boolean) request.getOrDefault("isInternal", false);

        ticketService.addComment(id, currentUser.getId(), comment, isInternal);

        return ResponseEntity.ok(ApiResponse.success("Comment added successfully", null));
    }

    @GetMapping("/{id}/incidents")
    public ResponseEntity<ApiResponse<List<TicketIncidentDto>>> getTicketIncidents(@PathVariable Long id) {
        List<TicketIncident> incidents = ticketService.getTicketIncidents(id);
        List<TicketIncidentDto> dtos = incidents.stream()
                .map(this::mapToIncidentDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<TicketComment>>> getTicketComments(@PathVariable Long id) {
        List<TicketComment> comments = ticketService.getTicketComments(id);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<TicketHistory>>> getTicketHistory(@PathVariable Long id) {
        List<TicketHistory> history = ticketService.getTicketHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/overdue-sla")
    public ResponseEntity<ApiResponse<List<TicketDto>>> getOverdueSlaTickets() {
        List<Ticket> tickets = ticketService.getOverdueSlaTickets();
        List<TicketDto> ticketDtos = tickets.stream()
                .map(this::mapToTicketDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(ticketDtos));
    }

    private TicketDto mapToTicketDto(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .cli(ticket.getCli())
                .clientName(ticket.getClientName())
                .clientType(ticket.getClientType())
                .agencyCode(ticket.getAgencyCode())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .assignedTo(ticket.getAssignedTo() != null ? mapToUserDto(ticket.getAssignedTo()) : null)
                .assignedBy(ticket.getAssignedBy() != null ? mapToUserDto(ticket.getAssignedBy()) : null)
                .assignedAt(ticket.getAssignedAt())
                .validatedBy(ticket.getValidatedBy() != null ? mapToUserDto(ticket.getValidatedBy()) : null)
                .validatedAt(ticket.getValidatedAt())
                .slaDeadline(ticket.getSlaDeadline())
                .slaBreached(ticket.getSlaBreached())
                .totalIncidents(ticket.getTotalIncidents())
                .resolvedIncidents(ticket.getResolvedIncidents())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private TicketIncidentDto mapToIncidentDto(TicketIncident incident) {
        return TicketIncidentDto.builder()
                .id(incident.getId())
                .incidentType(incident.getIncidentType())
                .category(incident.getCategory())
                .fieldName(incident.getFieldName())
                .fieldLabel(incident.getFieldLabel())
                .oldValue(incident.getOldValue())
                .newValue(incident.getNewValue())
                .status(incident.getStatus())
                .resolved(incident.getResolved())
                .resolvedAt(incident.getResolvedAt())
                .notes(incident.getNotes())
                .createdAt(incident.getCreatedAt())
                .build();
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .agencyCode(user.getAgencyCode())
                .build();
    }
}
