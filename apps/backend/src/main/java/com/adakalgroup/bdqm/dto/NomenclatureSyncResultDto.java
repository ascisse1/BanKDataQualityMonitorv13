package com.adakalgroup.bdqm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NomenclatureSyncResultDto {
    private String ctab;
    private String nomenclatureName;
    private int inserted;
    private int updated;
    private int deleted;
    private int errors;
    private LocalDateTime syncedAt;
    private long durationMs;
}
