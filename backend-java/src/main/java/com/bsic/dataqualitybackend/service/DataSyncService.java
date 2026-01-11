package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.config.metrics.BusinessMetricsConfig;
import com.bsic.dataqualitybackend.model.Agency;
import com.bsic.dataqualitybackend.model.Client;
import com.bsic.dataqualitybackend.repository.AgencyRepository;
import com.bsic.dataqualitybackend.repository.ClientRepository;
import com.bsic.dataqualitybackend.repository.InformixRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for synchronizing data from Informix CBS to MySQL.
 * Handles BKCLI (clients) and BKAGE (agencies) sync operations.
 * After sync, validates clients and creates anomalies for validation failures.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class DataSyncService {

    private final InformixRepository informixRepository;
    private final ClientRepository clientRepository;
    private final AgencyRepository agencyRepository;
    private final ClientValidationService clientValidationService;
    private final BusinessMetricsConfig metricsConfig;

    private static final int BATCH_SIZE = 1000;

    /**
     * Synchronize all clients from Informix BKCLI to MySQL bkcli table.
     * Uses upsert logic: insert new records, update existing ones.
     * After sync, validates clients and creates anomalies.
     *
     * @return SyncResult containing statistics
     */
    @Transactional
    public SyncResult syncClients() {
        log.info("Starting BKCLI sync from Informix to MySQL...");
        LocalDateTime startTime = LocalDateTime.now();

        int inserted = 0;
        int updated = 0;
        int errors = 0;
        List<Client> syncedClients = new ArrayList<>();

        try {
            List<Map<String, Object>> informixClients = informixRepository.getAllClients();
            log.info("Retrieved {} clients from Informix CBS", informixClients.size());

            for (Map<String, Object> row : informixClients) {
                try {
                    String cli = getStringValue(row, "cli");
                    if (cli == null || cli.isBlank()) {
                        log.warn("Skipping client with null/empty cli");
                        errors++;
                        continue;
                    }

                    Optional<Client> existingClient = clientRepository.findById(cli);
                    Client client = existingClient.orElse(new Client());
                    boolean isNew = existingClient.isEmpty();

                    mapInformixToClient(row, client);

                    if (isNew) {
                        client.setCreatedAt(LocalDateTime.now());
                        inserted++;
                    } else {
                        updated++;
                    }
                    client.setUpdatedAt(LocalDateTime.now());

                    Client savedClient = clientRepository.save(client);
                    syncedClients.add(savedClient);

                } catch (Exception e) {
                    log.error("Error syncing client: {}", e.getMessage());
                    errors++;
                }
            }

            log.info("BKCLI sync completed. Inserted: {}, Updated: {}, Errors: {}", inserted, updated, errors);

            // Run validation on synced clients and create anomalies
            if (!syncedClients.isEmpty()) {
                log.info("Starting validation for {} synced clients...", syncedClients.size());
                try {
                    ClientValidationService.ValidationResult validationResult =
                            clientValidationService.validateClientsAndCreateAnomalies(syncedClients);
                    log.info("Validation completed. Anomalies created: {}, Duplicates skipped: {}, Errors: {}",
                            validationResult.anomaliesCreated(),
                            validationResult.duplicatesSkipped(),
                            validationResult.errors());
                } catch (Exception e) {
                    log.error("Error during client validation: {}", e.getMessage(), e);
                }
            }

            metricsConfig.recordDataSyncSuccess();
            return new SyncResult("BKCLI", inserted, updated, errors, startTime, LocalDateTime.now());

        } catch (Exception e) {
            log.error("Failed to sync BKCLI: {}", e.getMessage(), e);
            metricsConfig.recordDataSyncFailure();
            throw new RuntimeException("BKCLI sync failed", e);
        }
    }

    /**
     * Synchronize all agencies from Informix BKAGE to MySQL bkage table.
     * Uses upsert logic: insert new records, update existing ones.
     *
     * @return SyncResult containing statistics
     */
    @Transactional
    public SyncResult syncAgencies() {
        log.info("Starting BKAGE (agencies) sync from Informix to MySQL...");
        LocalDateTime startTime = LocalDateTime.now();

        int inserted = 0;
        int updated = 0;
        int errors = 0;

        try {
            List<Map<String, Object>> informixAgencies = informixRepository.getAllAgencies();
            log.info("Retrieved {} agencies from Informix CBS", informixAgencies.size());

            for (Map<String, Object> row : informixAgencies) {
                try {
                    String age = getStringValue(row, "code");
                    if (age == null || age.isBlank()) {
                        log.warn("Skipping agency with null/empty age code");
                        errors++;
                        continue;
                    }

                    Optional<Agency> existingAgency = agencyRepository.findByAge(age);
                    Agency agency = existingAgency.orElse(new Agency());
                    boolean isNew = existingAgency.isEmpty();

                    mapInformixToAgency(row, agency);

                    if (isNew) {
                        inserted++;
                    } else {
                        updated++;
                    }

                    agencyRepository.save(agency);

                } catch (Exception e) {
                    log.error("Error syncing agency: {}", e.getMessage());
                    errors++;
                }
            }

            log.info("BKAGE sync completed. Inserted: {}, Updated: {}, Errors: {}", inserted, updated, errors);
            return new SyncResult("BKAGE", inserted, updated, errors, startTime, LocalDateTime.now());

        } catch (Exception e) {
            log.error("Failed to sync BKAGE: {}", e.getMessage(), e);
            throw new RuntimeException("BKAGE sync failed", e);
        }
    }

    /**
     * Synchronize clients in batches for very large datasets.
     * Useful when memory is limited or to reduce transaction size.
     */
    @Transactional
    public SyncResult syncClientsBatch() {
        log.info("Starting batched BKCLI sync from Informix to MySQL...");
        LocalDateTime startTime = LocalDateTime.now();

        int inserted = 0;
        int updated = 0;
        int errors = 0;
        int offset = 0;

        try {
            Long totalCount = informixRepository.getTotalClientsCount();
            log.info("Total clients to sync: {}", totalCount);

            while (offset < totalCount) {
                List<Map<String, Object>> batch = informixRepository.getClientsBatch(offset, BATCH_SIZE);
                log.info("Processing batch: offset={}, size={}", offset, batch.size());

                for (Map<String, Object> row : batch) {
                    try {
                        String cli = getStringValue(row, "cli");
                        if (cli == null || cli.isBlank()) {
                            errors++;
                            continue;
                        }

                        Optional<Client> existingClient = clientRepository.findById(cli);
                        Client client = existingClient.orElse(new Client());
                        boolean isNew = existingClient.isEmpty();

                        mapInformixToClient(row, client);

                        if (isNew) {
                            client.setCreatedAt(LocalDateTime.now());
                            inserted++;
                        } else {
                            updated++;
                        }
                        client.setUpdatedAt(LocalDateTime.now());

                        clientRepository.save(client);

                    } catch (Exception e) {
                        log.error("Error syncing client in batch: {}", e.getMessage());
                        errors++;
                    }
                }

                offset += BATCH_SIZE;

                if (batch.size() < BATCH_SIZE) {
                    break; // Last batch
                }
            }

            log.info("Batched BKCLI sync completed. Inserted: {}, Updated: {}, Errors: {}", inserted, updated, errors);
            return new SyncResult("BKCLI", inserted, updated, errors, startTime, LocalDateTime.now());

        } catch (Exception e) {
            log.error("Failed to sync BKCLI in batches: {}", e.getMessage(), e);
            throw new RuntimeException("BKCLI batch sync failed", e);
        }
    }

    /**
     * Map Informix row data to Client entity.
     * Maps all fields from bkcli table.
     */
    private void mapInformixToClient(Map<String, Object> row, Client client) {
        client.setCli(getStringValue(row, "cli"));
        client.setNom(getStringValue(row, "nom"));
        client.setTcli(getStringValue(row, "tcli"));
        client.setLib(getStringValue(row, "lib"));
        client.setPre(getStringValue(row, "pre"));
        client.setSext(getStringValue(row, "sext"));
        client.setNjf(getStringValue(row, "njf"));
        client.setDna(getLocalDateValue(row, "dna"));
        client.setViln(getStringValue(row, "viln"));
        client.setDepn(getStringValue(row, "depn"));
        client.setPayn(getStringValue(row, "payn"));
        client.setLocn(getStringValue(row, "locn"));
        client.setTid(getStringValue(row, "tid"));
        client.setNid(getStringValue(row, "nid"));
        client.setDid(getLocalDateValue(row, "did"));
        client.setLid(getStringValue(row, "lid"));
        client.setOid(getStringValue(row, "oid"));
        client.setVid(getLocalDateValue(row, "vid"));
        client.setSit(getStringValue(row, "sit"));
        client.setReg(getStringValue(row, "reg"));
        client.setCapj(getStringValue(row, "capj"));
        client.setDcapj(getLocalDateValue(row, "dcapj"));
        client.setSitj(getStringValue(row, "sitj"));
        client.setDsitj(getLocalDateValue(row, "dsitj"));
        client.setTconj(getStringValue(row, "tconj"));
        client.setConj(getStringValue(row, "conj"));
        client.setNbenf(getShortValue(row, "nbenf"));
        client.setClifam(getStringValue(row, "clifam"));
        client.setRso(getStringValue(row, "rso"));
        client.setSig(getStringValue(row, "sig"));
        client.setDatc(getLocalDateValue(row, "datc"));
        client.setFju(getStringValue(row, "fju"));
        client.setNrc(getStringValue(row, "nrc"));
        client.setVrc(getLocalDateValue(row, "vrc"));
        client.setNchc(getStringValue(row, "nchc"));
        client.setNpa(getStringValue(row, "npa"));
        client.setVpa(getLocalDateValue(row, "vpa"));
        client.setNidn(getStringValue(row, "nidn"));
        client.setNis(getStringValue(row, "nis"));
        client.setNidf(getStringValue(row, "nidf"));
        client.setGrp(getStringValue(row, "grp"));
        client.setSgrp(getStringValue(row, "sgrp"));
        client.setMet(getStringValue(row, "met"));
        client.setSmet(getStringValue(row, "smet"));
        client.setCmc1(getStringValue(row, "cmc1"));
        client.setCmc2(getStringValue(row, "cmc2"));
        client.setAge(getStringValue(row, "age"));
        client.setGes(getStringValue(row, "ges"));
        client.setQua(getStringValue(row, "qua"));
        client.setTax(getStringValue(row, "tax"));
        client.setCatl(getStringValue(row, "catl"));
        client.setSeg(getStringValue(row, "seg"));
        client.setNst(getStringValue(row, "nst"));
        client.setClipar(getStringValue(row, "clipar"));
        client.setChl1(getStringValue(row, "chl1"));
        client.setChl2(getStringValue(row, "chl2"));
        client.setChl3(getStringValue(row, "chl3"));
        client.setLter(getStringValue(row, "lter"));
        client.setLterc(getStringValue(row, "lterc"));
        client.setResd(getStringValue(row, "resd"));
        client.setCatn(getStringValue(row, "catn"));
        client.setSec(getStringValue(row, "sec"));
        client.setLienbq(getStringValue(row, "lienbq"));
        client.setAclas(getStringValue(row, "aclas"));
        client.setMaclas(getBigDecimalValue(row, "maclas"));
        client.setEmtit(getStringValue(row, "emtit"));
        client.setNicr(getStringValue(row, "nicr"));
        client.setCed(getStringValue(row, "ced"));
        client.setClcr(getStringValue(row, "clcr"));
        client.setNmer(getStringValue(row, "nmer"));
        client.setLang(getStringValue(row, "lang"));
        client.setNat(getStringValue(row, "nat"));
        client.setRes(getStringValue(row, "res"));
        client.setIchq(getStringValue(row, "ichq"));
        client.setDichq(getLocalDateValue(row, "dichq"));
        client.setIcb(getStringValue(row, "icb"));
        client.setDicb(getLocalDateValue(row, "dicb"));
        client.setEpu(getStringValue(row, "epu"));
        client.setUtic(getStringValue(row, "utic"));
        client.setUti(getStringValue(row, "uti"));
        client.setDou(getLocalDateValue(row, "dou"));
        client.setDmo(getLocalDateValue(row, "dmo"));
        client.setOrd(getBigDecimalValue(row, "ord"));
        client.setCatr(getStringValue(row, "catr"));
        client.setMidname(getStringValue(row, "midname"));
        client.setNomrest(getStringValue(row, "nomrest"));
        client.setDrc(getLocalDateValue(row, "drc"));
        client.setLrc(getStringValue(row, "lrc"));
        client.setRso2(getStringValue(row, "rso2"));
        client.setRegn(getStringValue(row, "regn"));
        client.setRrc(getStringValue(row, "rrc"));
        client.setDvrrc(getLocalDateValue(row, "dvrrc"));
        client.setUtiVrrc(getStringValue(row, "uti_vrrc"));
    }

    /**
     * Map Informix row data to Agency entity.
     */
    private void mapInformixToAgency(Map<String, Object> row, Agency agency) {
        agency.setAge(getStringValue(row, "code"));
        agency.setLib(getStringValue(row, "name"));
    }

    /**
     * Safely extract String value from row map.
     */
    private String getStringValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) {
            return null;
        }
        String strValue = value.toString().trim();
        return strValue.isEmpty() ? null : strValue;
    }

    /**
     * Safely extract LocalDate value from row map.
     * Handles both java.sql.Date and java.util.Date.
     */
    private LocalDate getLocalDateValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof java.util.Date utilDate) {
            return new Date(utilDate.getTime()).toLocalDate();
        }
        return null;
    }

    /**
     * Safely extract Short value from row map.
     */
    private Short getShortValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Short shortVal) {
            return shortVal;
        }
        if (value instanceof Number number) {
            return number.shortValue();
        }
        return null;
    }

    /**
     * Safely extract BigDecimal value from row map.
     */
    private BigDecimal getBigDecimalValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return null;
    }

    /**
     * Result class for sync operations.
     */
    public record SyncResult(
            String entity,
            int inserted,
            int updated,
            int errors,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
        public long durationSeconds() {
            return java.time.Duration.between(startTime, endTime).getSeconds();
        }

        public int totalProcessed() {
            return inserted + updated + errors;
        }
    }
}
