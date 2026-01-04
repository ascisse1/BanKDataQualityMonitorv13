package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.task.Task;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<String>> startWorkflow(@RequestBody Map<String, Object> request) {
        Long ticketId = ((Number) request.get("ticketId")).longValue();
        String clientId = (String) request.get("clientId");
        String agencyCode = (String) request.get("agencyCode");
        String priority = (String) request.get("priority");

        String processInstanceId = workflowService.startTicketWorkflow(ticketId, clientId, agencyCode, priority);

        return ResponseEntity.ok(ApiResponse.success("Workflow started", processInstanceId));
    }

    @GetMapping("/tasks/user/{userId}")
    public ResponseEntity<ApiResponse<List<Task>>> getUserTasks(@PathVariable Integer userId) {
        List<Task> tasks = workflowService.getTasksForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/tasks/group/{groupId}")
    public ResponseEntity<ApiResponse<List<Task>>> getGroupTasks(@PathVariable String groupId) {
        List<Task> tasks = workflowService.getTasksForGroup(groupId);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<ApiResponse<Task>> getTask(@PathVariable String taskId) {
        Task task = workflowService.getTaskById(taskId);

        if (task == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(ApiResponse.success(task));
    }

    @PostMapping("/tasks/{taskId}/claim")
    public ResponseEntity<ApiResponse<Void>> claimTask(
            @PathVariable String taskId,
            @RequestBody Map<String, Integer> request) {
        Integer userId = request.get("userId");
        workflowService.claimTask(taskId, userId);

        return ResponseEntity.ok(ApiResponse.success("Task claimed successfully", null));
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<ApiResponse<Void>> completeTask(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> request) {
        Integer userId = (Integer) request.get("userId");
        Map<String, Object> variables = (Map<String, Object>) request.get("variables");

        workflowService.completeUserTask(taskId, userId, variables);

        return ResponseEntity.ok(ApiResponse.success("Task completed successfully", null));
    }

    @PostMapping("/tasks/{taskId}/validate")
    public ResponseEntity<ApiResponse<Void>> validateTask(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> request) {
        Integer validatorId = (Integer) request.get("validatorId");
        Boolean approved = (Boolean) request.get("approved");
        String reason = (String) request.get("reason");

        workflowService.completeValidationTask(taskId, validatorId, approved, reason);

        return ResponseEntity.ok(ApiResponse.success("Validation completed", null));
    }

    @GetMapping("/process/{processInstanceId}/variables")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProcessVariables(
            @PathVariable String processInstanceId) {
        Map<String, Object> variables = workflowService.getProcessVariables(processInstanceId);
        return ResponseEntity.ok(ApiResponse.success(variables));
    }

    @GetMapping("/process/{processInstanceId}/status")
    public ResponseEntity<ApiResponse<Boolean>> getProcessStatus(
            @PathVariable String processInstanceId) {
        boolean isActive = workflowService.isProcessActive(processInstanceId);
        return ResponseEntity.ok(ApiResponse.success(isActive));
    }

    @DeleteMapping("/process/{processInstanceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProcess(
            @PathVariable String processInstanceId,
            @RequestParam String reason) {
        workflowService.deleteProcessInstance(processInstanceId, reason);
        return ResponseEntity.ok(ApiResponse.success("Process deleted", null));
    }
}
