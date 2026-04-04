package com.adakalgroup.bdqm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NomenclatureEntryDto {
    private Long id;
    private String ctab;
    private String cacc;
    private String age;
    private String lib1;
    private String lib2;
    private String lib3;
    private String lib4;
    private String lib5;
    private BigDecimal mnt1;
    private Boolean active;
    private LocalDateTime lastSyncedAt;
}
