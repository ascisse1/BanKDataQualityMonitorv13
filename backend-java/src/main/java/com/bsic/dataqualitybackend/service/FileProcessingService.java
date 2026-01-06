package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.UploadResultDto;
import com.bsic.dataqualitybackend.model.DataLoadHistory;
import com.bsic.dataqualitybackend.model.enums.LoadStatus;
import com.bsic.dataqualitybackend.repository.DataLoadHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileProcessingService {

    private final DataLoadHistoryRepository dataLoadHistoryRepository;

    @Transactional
    public UploadResultDto processCsvFile(MultipartFile file, String uploadedBy) {
        long startTime = System.currentTimeMillis();
        List<String> errors = new ArrayList<>();

        int totalRows = 0;
        int processedRows = 0;
        int successRows = 0;
        int failedRows = 0;
        int anomaliesDetected = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                totalRows++;
                try {
                    processedRows++;
                    successRows++;
                } catch (Exception e) {
                    failedRows++;
                    errors.add("Row " + totalRows + ": " + e.getMessage());
                    log.error("Error processing row {}: {}", totalRows, e.getMessage());
                }
            }

            long processingTime = System.currentTimeMillis() - startTime;

            DataLoadHistory history = DataLoadHistory.builder()
                .fileName(file.getOriginalFilename())
                .fileType("CSV")
                .fileSize(file.getSize())
                .recordsTotal(totalRows)
                .recordsProcessed(processedRows)
                .recordsSuccess(successRows)
                .recordsFailed(failedRows)
                .anomaliesDetected(anomaliesDetected)
                .status(failedRows == 0 ? LoadStatus.COMPLETED : LoadStatus.PARTIALLY_COMPLETED)
                .uploadedBy(uploadedBy)
                .processingTimeMs(processingTime)
                .build();

            dataLoadHistoryRepository.save(history);

            return UploadResultDto.builder()
                .fileName(file.getOriginalFilename())
                .totalRows(totalRows)
                .processedRows(processedRows)
                .successRows(successRows)
                .failedRows(failedRows)
                .anomaliesDetected(anomaliesDetected)
                .processingTimeMs(processingTime)
                .errors(errors)
                .status(failedRows == 0 ? "SUCCESS" : "PARTIAL")
                .build();

        } catch (Exception e) {
            log.error("Error processing CSV file: {}", e.getMessage(), e);

            DataLoadHistory history = DataLoadHistory.builder()
                .fileName(file.getOriginalFilename())
                .fileType("CSV")
                .fileSize(file.getSize())
                .status(LoadStatus.FAILED)
                .errorMessage(e.getMessage())
                .uploadedBy(uploadedBy)
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();

            dataLoadHistoryRepository.save(history);

            throw new RuntimeException("Error processing CSV file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public UploadResultDto processExcelFile(MultipartFile file, String uploadedBy) {
        long startTime = System.currentTimeMillis();
        List<String> errors = new ArrayList<>();

        int totalRows = 0;
        int processedRows = 0;
        int successRows = 0;
        int failedRows = 0;
        int anomaliesDetected = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                totalRows++;
                try {
                    processedRows++;
                    successRows++;
                } catch (Exception e) {
                    failedRows++;
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                    log.error("Error processing row {}: {}", i + 1, e.getMessage());
                }
            }

            long processingTime = System.currentTimeMillis() - startTime;

            DataLoadHistory history = DataLoadHistory.builder()
                .fileName(file.getOriginalFilename())
                .fileType("EXCEL")
                .fileSize(file.getSize())
                .recordsTotal(totalRows)
                .recordsProcessed(processedRows)
                .recordsSuccess(successRows)
                .recordsFailed(failedRows)
                .anomaliesDetected(anomaliesDetected)
                .status(failedRows == 0 ? LoadStatus.COMPLETED : LoadStatus.PARTIALLY_COMPLETED)
                .uploadedBy(uploadedBy)
                .processingTimeMs(processingTime)
                .build();

            dataLoadHistoryRepository.save(history);

            return UploadResultDto.builder()
                .fileName(file.getOriginalFilename())
                .totalRows(totalRows)
                .processedRows(processedRows)
                .successRows(successRows)
                .failedRows(failedRows)
                .anomaliesDetected(anomaliesDetected)
                .processingTimeMs(processingTime)
                .errors(errors)
                .status(failedRows == 0 ? "SUCCESS" : "PARTIAL")
                .build();

        } catch (Exception e) {
            log.error("Error processing Excel file: {}", e.getMessage(), e);

            DataLoadHistory history = DataLoadHistory.builder()
                .fileName(file.getOriginalFilename())
                .fileType("EXCEL")
                .fileSize(file.getSize())
                .status(LoadStatus.FAILED)
                .errorMessage(e.getMessage())
                .uploadedBy(uploadedBy)
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();

            dataLoadHistoryRepository.save(history);

            throw new RuntimeException("Error processing Excel file: " + e.getMessage(), e);
        }
    }
}
