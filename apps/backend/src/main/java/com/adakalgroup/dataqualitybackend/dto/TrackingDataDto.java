package com.adakalgroup.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingDataDto {

    private String structureCode;
    private String structureName;
    private FluxDto flux;
    private StockDto stock;
    private GeneralDto general;
    private IndicatorsDto indicators;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FluxDto {
        @Builder.Default
        private long total = 0;
        @Builder.Default
        private long anomalies = 0;
        @Builder.Default
        private long fiabilises = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockDto {
        @Builder.Default
        private long actifs = 0;
        @Builder.Default
        private long anomalies = 0;
        @Builder.Default
        private long fiabilises = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeneralDto {
        @Builder.Default
        private long actifs = 0;
        @Builder.Default
        private long anomalies = 0;
        @Builder.Default
        private long fiabilises = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndicatorsDto {
        @Builder.Default
        private double tauxAnomalies = 0.0;
        @Builder.Default
        private double tauxFiabilisation = 0.0;
    }
}
