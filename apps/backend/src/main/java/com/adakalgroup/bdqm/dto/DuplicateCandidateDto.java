package com.adakalgroup.bdqm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateCandidateDto {
    private String id;

    @JsonProperty("client_id_1")
    private String clientId1;

    @JsonProperty("client_id_2")
    private String clientId2;

    @JsonProperty("client_name_1")
    private String clientName1;

    @JsonProperty("client_name_2")
    private String clientName2;

    @JsonProperty("similarity_score")
    private double similarityScore;

    @JsonProperty("matching_fields")
    private List<String> matchingFields;

    @JsonProperty("client_type")
    private String clientType;

    private String status;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("reviewed_at")
    private String reviewedAt;

    @JsonProperty("reviewed_by")
    private String reviewedBy;
}
