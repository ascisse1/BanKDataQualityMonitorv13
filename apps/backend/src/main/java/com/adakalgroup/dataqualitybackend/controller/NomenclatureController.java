package com.adakalgroup.dataqualitybackend.controller;

import com.adakalgroup.dataqualitybackend.dto.ApiResponse;
import com.adakalgroup.dataqualitybackend.dto.NomenclatureEntryDto;
import com.adakalgroup.dataqualitybackend.dto.NomenclatureSyncResultDto;
import com.adakalgroup.dataqualitybackend.dto.NomenclatureTypeDto;
import com.adakalgroup.dataqualitybackend.service.NomenclatureService;
import com.adakalgroup.dataqualitybackend.service.NomenclatureSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/nomenclatures")
@PreAuthorize("hasRole('ADMIN')")
public class NomenclatureController {

    private final NomenclatureService nomenclatureService;
    private final NomenclatureSyncService nomenclatureSyncService;

    public NomenclatureController(
            NomenclatureService nomenclatureService,
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            NomenclatureSyncService nomenclatureSyncService) {
        this.nomenclatureService = nomenclatureService;
        this.nomenclatureSyncService = nomenclatureSyncService;
    }

    // ===== Nomenclature Types =====

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<NomenclatureTypeDto>>> getAllTypes() {
        List<NomenclatureTypeDto> types = nomenclatureService.getAllTypes();
        return ResponseEntity.ok(ApiResponse.success(types));
    }

    @GetMapping("/types/{id}")
    public ResponseEntity<ApiResponse<NomenclatureTypeDto>> getType(@PathVariable Long id) {
        NomenclatureTypeDto type = nomenclatureService.getType(id);
        return ResponseEntity.ok(ApiResponse.success(type));
    }

    @PostMapping("/types")
    public ResponseEntity<ApiResponse<NomenclatureTypeDto>> createType(@RequestBody NomenclatureTypeDto dto) {
        NomenclatureTypeDto created = nomenclatureService.createType(dto);
        return ResponseEntity.ok(ApiResponse.success("Type de nomenclature créé avec succès", created));
    }

    @PutMapping("/types/{id}")
    public ResponseEntity<ApiResponse<NomenclatureTypeDto>> updateType(@PathVariable Long id, @RequestBody NomenclatureTypeDto dto) {
        NomenclatureTypeDto updated = nomenclatureService.updateType(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Type de nomenclature mis à jour avec succès", updated));
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteType(@PathVariable Long id) {
        nomenclatureService.deleteType(id);
        return ResponseEntity.ok(ApiResponse.success("Type de nomenclature désactivé avec succès", null));
    }

    // ===== Nomenclature Entries =====

    @GetMapping("/types/{ctab}/entries")
    public ResponseEntity<ApiResponse<List<NomenclatureEntryDto>>> getEntries(@PathVariable String ctab) {
        List<NomenclatureEntryDto> entries = nomenclatureService.getEntriesByCtab(ctab);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/types/{ctab}/entries/search")
    public ResponseEntity<ApiResponse<List<NomenclatureEntryDto>>> searchEntries(
            @PathVariable String ctab, @RequestParam String q) {
        List<NomenclatureEntryDto> entries = nomenclatureService.searchEntries(ctab, q);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    // ===== Sync =====

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<List<NomenclatureSyncResultDto>>> syncAll() {
        if (nomenclatureSyncService == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    "Synchronisation non disponible: intégration Informix désactivée", Collections.emptyList()));
        }
        List<NomenclatureSyncResultDto> results = nomenclatureSyncService.syncAll();
        return ResponseEntity.ok(ApiResponse.success("Synchronisation des nomenclatures terminée", results));
    }

    @PostMapping("/sync/{ctab}")
    public ResponseEntity<ApiResponse<NomenclatureSyncResultDto>> syncByCtab(@PathVariable String ctab) {
        if (nomenclatureSyncService == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    "Synchronisation non disponible: intégration Informix désactivée", null));
        }
        NomenclatureSyncResultDto result = nomenclatureSyncService.syncByCtab(ctab);
        return ResponseEntity.ok(ApiResponse.success("Synchronisation de la nomenclature " + ctab + " terminée", result));
    }
}
