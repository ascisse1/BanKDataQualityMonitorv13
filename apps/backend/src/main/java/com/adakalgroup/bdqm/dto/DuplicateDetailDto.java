package com.adakalgroup.bdqm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateDetailDto {
    @JsonProperty("client_1")
    private ClientDetailsDto client1;

    @JsonProperty("client_2")
    private ClientDetailsDto client2;

    @JsonProperty("similarity_analysis")
    private SimilarityAnalysisDto similarityAnalysis;
}
