package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.dto.DataLoadHistoryDto;
import com.bsic.dataqualitybackend.dto.UploadResultDto;
import com.bsic.dataqualitybackend.model.DataLoadHistory;
import com.bsic.dataqualitybackend.repository.DataLoadHistoryRepository;
import com.bsic.dataqualitybackend.service.FileProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileUploadController {

    private final FileProcessingService fileProcessingService;
    private final DataLoadHistoryRepository dataLoadHistoryRepository;

    @PostMapping("/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<UploadResultDto>> uploadCsv(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        validateFile(file, "csv");

        String username = authentication.getName();
        UploadResultDto result = fileProcessingService.processCsvFile(file, username);

        return ResponseEntity.ok(ApiResponse.success("Fichier CSV traité avec succès", result));
    }

    @PostMapping("/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<UploadResultDto>> uploadExcel(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        validateFile(file, "xlsx", "xls");

        String username = authentication.getName();
        UploadResultDto result = fileProcessingService.processExcelFile(file, username);

        return ResponseEntity.ok(ApiResponse.success("Fichier Excel traité avec succès", result));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<DataLoadHistoryDto>>> getDataLoadHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("loadDate").descending());
        Page<DataLoadHistory> history = dataLoadHistoryRepository.findAllOrderByLoadDateDesc(pageable);

        Page<DataLoadHistoryDto> dtoPage = history.map(this::mapToDto);

        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    private void validateFile(MultipartFile file, String... extensions) {
        if (file.isEmpty()) {
            throw new RuntimeException("Le fichier est vide");
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("Nom de fichier invalide");
        }

        boolean validExtension = Arrays.stream(extensions)
            .anyMatch(ext -> filename.toLowerCase().endsWith("." + ext));

        if (!validExtension) {
            throw new RuntimeException(
                "Extension invalide. Extensions acceptées: " + String.join(", ", extensions));
        }

        if (file.getSize() > 50 * 1024 * 1024) {
            throw new RuntimeException("Le fichier est trop volumineux (max 50 MB)");
        }
    }

    private DataLoadHistoryDto mapToDto(DataLoadHistory history) {
        return DataLoadHistoryDto.builder()
            .id(history.getId())
            .fileName(history.getFileName())
            .fileType(history.getFileType())
            .fileSize(history.getFileSize())
            .recordsTotal(history.getRecordsTotal())
            .recordsProcessed(history.getRecordsProcessed())
            .recordsSuccess(history.getRecordsSuccess())
            .recordsFailed(history.getRecordsFailed())
            .anomaliesDetected(history.getAnomaliesDetected())
            .status(history.getStatus())
            .errorMessage(history.getErrorMessage())
            .uploadedBy(history.getUploadedBy())
            .processingTimeMs(history.getProcessingTimeMs())
            .loadDate(history.getLoadDate())
            .build();
    }
}
