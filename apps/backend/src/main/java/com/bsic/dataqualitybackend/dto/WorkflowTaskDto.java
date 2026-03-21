package com.bsic.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.flowable.task.api.Task;

import java.util.Date;

/**
 * DTO for workflow tasks.
 * Used to serialize Task data for frontend consumption.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTaskDto {

    private String id;
    private String name;
    private String assignee;
    private Date created;
    private Date due;
    private String processInstanceId;
    private String taskDefinitionKey;
    private String description;
    private int priority;

    /**
     * Create DTO from Flowable Task
     */
    public static WorkflowTaskDto fromTask(Task task) {
        if (task == null) {
            return null;
        }

        return WorkflowTaskDto.builder()
                .id(task.getId())
                .name(task.getName())
                .assignee(task.getAssignee())
                .created(task.getCreateTime())
                .due(task.getDueDate())
                .processInstanceId(task.getProcessInstanceId())
                .taskDefinitionKey(task.getTaskDefinitionKey())
                .description(task.getDescription())
                .priority(task.getPriority())
                .build();
    }
}
