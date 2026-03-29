package com.bsic.dataqualitybackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final RuntimeService runtimeService;
    private final org.flowable.engine.TaskService taskService;

    public String startTicketWorkflow(Long ticketId, String clientId, String structureCode, String priority, String initiator) {
        log.info("Starting ticket workflow for ticket: {} by user: {}", ticketId, initiator);

        Map<String, Object> variables = new HashMap<>();
        variables.put("ticketId", ticketId);
        variables.put("clientId", clientId);
        variables.put("structureCode", structureCode);
        variables.put("priority", priority);
        variables.put("initiator", initiator);

        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(
            "ticket-correction-process",
            ticketId.toString(),
            variables
        );

        log.info("Workflow started: Process Instance ID = {}", processInstance.getProcessInstanceId());
        return processInstance.getProcessInstanceId();
    }

    public void completeUserTask(String taskId, String userId, Map<String, Object> variables) {
        log.info("Completing user task: {} by user: {}", taskId, userId);

        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();

        if (task == null) {
            throw new IllegalArgumentException("Task not found: " + taskId);
        }

        if (variables != null) {
            taskService.complete(taskId, variables);
        } else {
            taskService.complete(taskId);
        }

        log.info("Task completed: {}", taskId);
    }

    public void completeValidationTask(String taskId, String validatorId, boolean approved, String reason) {
        log.info("Completing validation task: {} - Approved: {}", taskId, approved);

        Map<String, Object> variables = new HashMap<>();
        variables.put("validationApproved", approved);
        variables.put("validatorId", validatorId);

        if (!approved && reason != null) {
            variables.put("rejectionReason", reason);
        }

        completeUserTask(taskId, validatorId, variables);
    }

    public List<Task> getTasksForUser(String userId) {
        return taskService.createTaskQuery()
            .taskAssignee(userId)
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

    public void claimTask(String taskId, String userId) {
        taskService.claim(taskId, userId);
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

    /**
     * Find the active user task for a ticket (by business key)
     */
    public Task getActiveTaskForTicket(Long ticketId) {
        List<Task> tasks = taskService.createTaskQuery()
            .processInstanceBusinessKey(ticketId.toString())
            .active()
            .list();
        return tasks.isEmpty() ? null : tasks.get(0);
    }

    /**
     * Complete the agency correction task with correction data
     */
    public void completeCorrectionTask(Long ticketId, String userId, String fieldName,
                                        String oldValue, String newValue, String notes) {
        Task task = getActiveTaskForTicket(ticketId);

        if (task == null) {
            log.warn("No active task found for ticket: {}", ticketId);
            return;
        }

        if (!"Task_AgencyCorrection".equals(task.getTaskDefinitionKey())) {
            log.warn("Active task is not AgencyCorrection task: {}", task.getTaskDefinitionKey());
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("correctionFieldName", fieldName);
        variables.put("correctionOldValue", oldValue);
        variables.put("correctionNewValue", newValue);
        variables.put("correctionNotes", notes);
        variables.put("correctedBy", userId);

        completeUserTask(task.getId(), userId, variables);
        log.info("Correction task completed for ticket {} - moving to 4-Eyes validation", ticketId);
    }

    public void deleteProcessInstance(String processInstanceId, String reason) {
        runtimeService.deleteProcessInstance(processInstanceId, reason);
        log.info("Process instance deleted: {} - Reason: {}", processInstanceId, reason);
    }
}
