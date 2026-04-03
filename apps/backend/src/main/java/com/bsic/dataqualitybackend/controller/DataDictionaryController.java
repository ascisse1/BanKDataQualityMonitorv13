package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.dto.CbsFieldDto;
import com.bsic.dataqualitybackend.dto.CbsTableDto;
import com.bsic.dataqualitybackend.service.CbsDataDictionaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/data-dictionary")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class DataDictionaryController {

    private final CbsDataDictionaryService dataDictionaryService;

    // ===== Tables =====

    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<CbsTableDto>>> getAllTables() {
        List<CbsTableDto> tables = dataDictionaryService.getAllTables();
        return ResponseEntity.ok(ApiResponse.success(tables));
    }

    @GetMapping("/tables/{id}")
    public ResponseEntity<ApiResponse<CbsTableDto>> getTable(@PathVariable Long id) {
        CbsTableDto table = dataDictionaryService.getTable(id);
        return ResponseEntity.ok(ApiResponse.success(table));
    }

    @PostMapping("/tables")
    public ResponseEntity<ApiResponse<CbsTableDto>> createTable(@RequestBody CbsTableDto dto) {
        CbsTableDto created = dataDictionaryService.createTable(dto);
        return ResponseEntity.ok(ApiResponse.success("Table CBS créée avec succès", created));
    }

    @PutMapping("/tables/{id}")
    public ResponseEntity<ApiResponse<CbsTableDto>> updateTable(@PathVariable Long id, @RequestBody CbsTableDto dto) {
        CbsTableDto updated = dataDictionaryService.updateTable(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Table CBS mise à jour avec succès", updated));
    }

    @DeleteMapping("/tables/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable Long id) {
        dataDictionaryService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success("Table CBS désactivée avec succès", null));
    }

    // ===== Fields =====

    @GetMapping("/tables/{tableId}/fields")
    public ResponseEntity<ApiResponse<List<CbsFieldDto>>> getFieldsByTable(@PathVariable Long tableId) {
        List<CbsFieldDto> fields = dataDictionaryService.getFieldsByTable(tableId);
        return ResponseEntity.ok(ApiResponse.success(fields));
    }

    @GetMapping("/tables/by-name/{tableName}/fields")
    public ResponseEntity<ApiResponse<List<CbsFieldDto>>> getFieldsByTableName(@PathVariable String tableName) {
        List<CbsFieldDto> fields = dataDictionaryService.getFieldsByTableName(tableName);
        return ResponseEntity.ok(ApiResponse.success(fields));
    }

    @PostMapping("/tables/{tableId}/fields")
    public ResponseEntity<ApiResponse<CbsFieldDto>> createField(@PathVariable Long tableId, @RequestBody CbsFieldDto dto) {
        CbsFieldDto created = dataDictionaryService.createField(tableId, dto);
        return ResponseEntity.ok(ApiResponse.success("Champ CBS créé avec succès", created));
    }

    @GetMapping("/fields/{id}")
    public ResponseEntity<ApiResponse<CbsFieldDto>> getField(@PathVariable Long id) {
        CbsFieldDto field = dataDictionaryService.getField(id);
        return ResponseEntity.ok(ApiResponse.success(field));
    }

    @PutMapping("/fields/{id}")
    public ResponseEntity<ApiResponse<CbsFieldDto>> updateField(@PathVariable Long id, @RequestBody CbsFieldDto dto) {
        CbsFieldDto updated = dataDictionaryService.updateField(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Champ CBS mis à jour avec succès", updated));
    }

    @DeleteMapping("/fields/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteField(@PathVariable Long id) {
        dataDictionaryService.deleteField(id);
        return ResponseEntity.ok(ApiResponse.success("Champ CBS désactivé avec succès", null));
    }
}
