package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.repository.UserRepository;
import com.bsic.dataqualitybackend.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component("assignTicketDelegate")
@RequiredArgsConstructor
public class AssignTicketDelegate implements JavaDelegate {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    @Override
    public void execute(DelegateExecution execution) {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String agencyCode = (String) execution.getVariable("agencyCode");

        log.info("Auto-assigning ticket {} to agency {}", ticketId, agencyCode);

        List<User> agencyUsers = userRepository.findActiveAgencyUsers(agencyCode);

        if (agencyUsers.isEmpty()) {
            log.warn("No active users found for agency: {} - keeping current assignee", agencyCode);
            String currentAssignee = (String) execution.getVariable("assignedUserId");
            log.info("Ticket {} will remain assigned to: {}", ticketId, currentAssignee);
            execution.setVariable("assignmentFailed", true);
            execution.setVariable("assignedUserName", "Unassigned - No Agency Users");
            return;
        }

        User selectedUser = selectUserWithLeastTickets(agencyUsers);

        Integer systemUserId = 1;
        Ticket assignedTicket = ticketService.assignTicket(ticketId, selectedUser.getId(), systemUserId);

        execution.setVariable("assignedUserId", selectedUser.getUsername());
        execution.setVariable("assignedUserIdNum", selectedUser.getId());
        execution.setVariable("assignedUserName", selectedUser.getFullName());
        execution.setVariable("assignmentFailed", false);

        log.info("Ticket {} assigned to user: {} (ID: {})", ticketId, selectedUser.getUsername(), selectedUser.getId());
    }

    private User selectUserWithLeastTickets(List<User> users) {
        return users.get(0);
    }
}
