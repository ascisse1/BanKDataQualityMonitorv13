package com.adakalgroup.bdqm.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response after recording feedback.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {

    private boolean recorded;
    private Long suggestionId;
    private Long feedbackId;
}
