package com.bsic.dataqualitybackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final RuntimeService runtimeService;
    private final TaskService taskService;

    public String startTicketWorkflow(Long ticketId, String clientId, String agencyCode, String priority) {
        log.info("Starting ticket workflow for ticket: {}", ticketId);

        Map<String, Object> variables = new HashMap<>();
        variables.put("ticketId", ticketId);
        variables.put("clientId", clientId);
        variables.put("agencyCode", agencyCode);
        variables.put("priority", priority);

        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(
            "ticket-correction-process",
            ticketId.toString(),
            variables
        );

        log.info("Workflow started: Process Instance ID = {}", processInstance.getProcessInstanceId());
        return processInstance.getProcessInstanceId();
    }

    public void completeUserTask(String taskId, Integer userId, Map<String, Object> variables) {
        log.info("Completing user task: {}", taskId);

        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();

        if (task == null) {
            throw new IllegalArgumentException("Task not found: " + taskId);
        }

        if (variables != null) {
            taskService.setVariables(taskId, variables);
        }

        taskService.complete(taskId);
        log.info("Task completed: {}", taskId);
    }

    public void completeValidationTask(String taskId, Integer validatorId, boolean approved, String reason) {
        log.info("Completing validation task: {} - Approved: {}", taskId, approved);

        Map<String, Object> variables = new HashMap<>();
        variables.put("validationApproved", approved);
        variables.put("validatorId", validatorId);

        if (!approved && reason != null) {
            variables.put("rejectionReason", reason);
        }

        completeUserTask(taskId, validatorId, variables);
    }

    public void notifyRpaCompletion(String processInstanceId, boolean success, String errorMessage) {
        log.info("RPA completion notification for process: {} - Success: {}", processInstanceId, success);

        Map<String, Object> variables = new HashMap<>();
        variables.put("rpaSuccess", success);
        variables.put("rpaInProgress", false);

        if (!success && errorMessage != null) {
            variables.put("rpaErrorMessage", errorMessage);
        }

        runtimeService.setVariables(processInstanceId, variables);

        runtimeService.createMessageCorrelation("RPA_COMPLETED")
            .processInstanceId(processInstanceId)
            .correlateWithResult();

        log.info("RPA completion message sent to process: {}", processInstanceId);
    }

    public List<Task> getTasksForUser(Integer userId) {
        return taskService.createTaskQuery()
            .taskAssignee(userId.toString())
            .list();
    }

    public List<Task> getTasksForGroup(String groupId) {
        return taskService.createTaskQuery()
            .taskCandidateGroup(groupId)
            .list();
    }

    public Task getTaskById(String taskId) {
        return taskService.createTaskQuery()
            .taskId(taskId)
            .singleResult();
    }

    public void claimTask(String taskId, Integer userId) {
        taskService.claim(taskId, userId.toString());
        log.info("Task {} claimed by user {}", taskId, userId);
    }

    public Map<String, Object> getProcessVariables(String processInstanceId) {
        return runtimeService.getVariables(processInstanceId);
    }

    public boolean isProcessActive(String processInstanceId) {
        return runtimeService.createProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .active()
            .count() > 0;
    }

    public void deleteProcessInstance(String processInstanceId, String reason) {
        runtimeService.deleteProcessInstance(processInstanceId, reason);
        log.info("Process instance deleted: {} - Reason: {}", processInstanceId, reason);
    }
}
