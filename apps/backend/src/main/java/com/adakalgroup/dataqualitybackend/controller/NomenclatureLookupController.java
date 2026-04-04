package com.adakalgroup.dataqualitybackend.controller;

import com.adakalgroup.dataqualitybackend.dto.ApiResponse;
import com.adakalgroup.dataqualitybackend.dto.NomenclatureEntryDto;
import com.adakalgroup.dataqualitybackend.service.NomenclatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nomenclatures")
@RequiredArgsConstructor
public class NomenclatureLookupController {

    private final NomenclatureService nomenclatureService;

    @GetMapping("/{ctab}/values")
    public ResponseEntity<ApiResponse<List<NomenclatureEntryDto>>> getValues(@PathVariable String ctab) {
        List<NomenclatureEntryDto> entries = nomenclatureService.getEntriesByCtab(ctab);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/{ctab}/lookup/{cacc}")
    public ResponseEntity<ApiResponse<Map<String, String>>> lookup(
            @PathVariable String ctab, @PathVariable String cacc) {
        String label = nomenclatureService.getLabel(ctab, cacc).orElse(null);
        Map<String, String> result = Map.of("cacc", cacc, "label", label != null ? label : "");
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
