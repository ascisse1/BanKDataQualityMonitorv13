package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.FatcaConfig;
import com.adakalgroup.bdqm.model.FatcaClient;
import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.model.enums.FatcaStatus;
import com.adakalgroup.bdqm.repository.FatcaClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * FATCA US indicia screening service.
 * Works with Map&lt;String, Object&gt; records (dictionary-driven, no hardcoded entity).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FatcaScreeningService {

    private static final int BATCH_SIZE = 1000;
    private static final String CLIENT_TABLE = "bkcli";

    private static final Set<String> US_COUNTRY_CODES = Set.of("US", "USA", "ETU");

    private final FatcaClientRepository fatcaClientRepository;
    private final StructureService structureService;
    private final FatcaAuditService fatcaAuditService;
    private final FatcaConfig fatcaConfig;

    @Autowired(required = false)
    private DynamicCbsQueryService dynamicCbsQueryService;

    /**
     * Screens all clients in the bkcli mirror table for US indicia.
     * Uses DynamicCbsQueryService for dictionary-driven pagination.
     */
    @Transactional
    public ScreeningResult screenAllClients() {
        if (!fatcaConfig.isScreeningEnabled()) {
            log.info("FATCA screening is disabled");
            return new ScreeningResult(0, 0, 0, 0);
        }

        if (dynamicCbsQueryService == null) {
            log.warn("FATCA screening requires Informix integration to be enabled");
            return new ScreeningResult(0, 0, 0, 0);
        }

        log.info("Starting FATCA US indicia screening...");
        long startTime = System.currentTimeMillis();

        int totalScanned = 0;
        int newDetections = 0;
        int updated = 0;
        int errors = 0;

        Map<String, String> agencyNameMap = loadAgencyNameMap();

        int offset = 0;
        while (true) {
            List<Map<String, Object>> batch = dynamicCbsQueryService.fetchFromCbs(CLIENT_TABLE, offset, BATCH_SIZE);
            if (batch.isEmpty()) break;

            Set<String> batchClientIds = batch.stream()
                .map(r -> getString(r, "cli"))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            Map<String, FatcaClient> existingFatcaMap = batchClientIds.isEmpty()
                ? Collections.emptyMap()
                : fatcaClientRepository.findByClientNumberIn(batchClientIds).stream()
                    .collect(Collectors.toMap(FatcaClient::getClientNumber, fc -> fc, (a, b) -> a));

            for (Map<String, Object> record : batch) {
                try {
                    List<IndiciaMatch> matches = screenRecord(record);
                    totalScanned++;

                    String cli = getString(record, "cli");
                    if (!matches.isEmpty() && cli != null) {
                        FatcaClient existing = existingFatcaMap.get(cli);
                        if (existing != null) {
                            if (updateExistingFatcaClient(existing, record, matches, agencyNameMap)) {
                                updated++;
                            }
                        } else {
                            createFatcaClient(record, matches, agencyNameMap);
                            newDetections++;
                        }
                    }
                } catch (Exception e) {
                    errors++;
                    log.warn("Error screening record: {}", e.getMessage());
                }
            }

            offset += BATCH_SIZE;
            if (batch.size() < BATCH_SIZE) break;
        }

        long elapsed = System.currentTimeMillis() - startTime;
        log.info("FATCA screening completed in {}ms: scanned={}, newDetections={}, updated={}, errors={}",
            elapsed, totalScanned, newDetections, updated, errors);

        return new ScreeningResult(totalScanned, newDetections, updated, errors);
    }

    /**
     * Evaluates a single CBS record against all US indicia rules.
     */
    public List<IndiciaMatch> screenRecord(Map<String, Object> record) {
        List<IndiciaMatch> matches = new ArrayList<>();

        String payn = getString(record, "payn");
        if (isUsCountryCode(payn)) {
            matches.add(new IndiciaMatch("BIRTH_COUNTRY", "payn", payn,
                "Pays de naissance: " + payn));
        }

        String nat = getString(record, "nat");
        if (isUsCountryCode(nat)) {
            matches.add(new IndiciaMatch("NATIONALITY", "nat", nat,
                "Nationalité: " + nat));
        }

        String res = getString(record, "res");
        if (isUsCountryCode(res)) {
            matches.add(new IndiciaMatch("RESIDENCE", "res", res,
                "Pays de résidence: " + res));
        }

        String resd = getString(record, "resd");
        if (isUsCountryCode(resd)) {
            matches.add(new IndiciaMatch("RESIDENCE_DETAIL", "resd", resd,
                "Résidence détail: " + resd));
        }

        String viln = getString(record, "viln");
        if (viln != null && isUsBirthPlace(viln)) {
            matches.add(new IndiciaMatch("BIRTH_PLACE", "viln", viln,
                "Lieu de naissance US: " + viln));
        }

        return matches;
    }

    private boolean isUsCountryCode(String code) {
        return code != null && US_COUNTRY_CODES.contains(code.trim().toUpperCase());
    }

    private boolean isUsBirthPlace(String birthPlace) {
        if (birthPlace == null) return false;
        String upper = birthPlace.trim().toUpperCase();
        Set<String> usMarkers = Set.of(
            "NEW YORK", "LOS ANGELES", "CHICAGO", "HOUSTON", "PHOENIX",
            "PHILADELPHIA", "SAN ANTONIO", "SAN DIEGO", "DALLAS", "WASHINGTON DC",
            "MIAMI", "ATLANTA", "BOSTON", "SEATTLE", "DETROIT", "DENVER",
            "UNITED STATES", "USA", "U.S.A.", "ETATS-UNIS", "ETATS UNIS"
        );
        for (String marker : usMarkers) {
            if (upper.contains(marker)) return true;
        }
        return false;
    }

    private void createFatcaClient(Map<String, Object> record, List<IndiciaMatch> matches,
                                    Map<String, String> agencyNameMap) {
        String cli = getString(record, "cli");
        String age = getString(record, "age");
        String tcli = getString(record, "tcli");
        String indiciaTypes = matches.stream().map(IndiciaMatch::type).collect(Collectors.joining(","));

        ClientType clientType = "2".equals(tcli) ? ClientType.CORPORATE : ClientType.INDIVIDUAL;
        String structureName = agencyNameMap.getOrDefault(age, age);

        FatcaClient fatcaClient = FatcaClient.builder()
            .clientNumber(cli)
            .clientName(buildClientName(record))
            .clientType(clientType)
            .structureCode(age)
            .structureName(structureName)
            .fatcaStatus(FatcaStatus.PENDING_REVIEW)
            .taxResidenceCountry(getString(record, "res"))
            .usPerson(true)
            .birthPlace(getString(record, "viln"))
            .birthCountry(getString(record, "payn"))
            .usAddress(matches.stream().anyMatch(m -> "US_ADDRESS".equals(m.type())))
            .usPhone(matches.stream().anyMatch(m -> "US_PHONE".equals(m.type())))
            .riskLevel(calculateRiskLevel(matches))
            .reportingRequired(true)
            .indiciaTypes(indiciaTypes)
            .indiciaCount(matches.size())
            .lastScreeningDate(LocalDateTime.now())
            .detectionSource("AUTO_SCREENING")
            .build();

        fatcaClientRepository.save(fatcaClient);

        for (IndiciaMatch match : matches) {
            fatcaAuditService.logAutoDetection(cli, match.type(), match.description());
        }
    }

    private boolean updateExistingFatcaClient(FatcaClient existing, Map<String, Object> record,
                                               List<IndiciaMatch> matches, Map<String, String> agencyNameMap) {
        if (existing.getFatcaStatus() == FatcaStatus.COMPLIANT ||
            existing.getFatcaStatus() == FatcaStatus.EXEMPT) {
            existing.setLastScreeningDate(LocalDateTime.now());
            fatcaClientRepository.save(existing);
            return false;
        }

        String newIndiciaTypes = matches.stream().map(IndiciaMatch::type).collect(Collectors.joining(","));
        String previousIndicia = existing.getIndiciaTypes();
        boolean indiciaChanged = !newIndiciaTypes.equals(previousIndicia);

        if (indiciaChanged) {
            String age = getString(record, "age");
            existing.setIndiciaTypes(newIndiciaTypes);
            existing.setIndiciaCount(matches.size());
            existing.setRiskLevel(calculateRiskLevel(matches));
            existing.setUsPerson(true);
            existing.setBirthCountry(getString(record, "payn"));
            existing.setBirthPlace(getString(record, "viln"));
            existing.setTaxResidenceCountry(getString(record, "res"));
            existing.setUsAddress(matches.stream().anyMatch(m -> "US_ADDRESS".equals(m.type())));
            existing.setUsPhone(matches.stream().anyMatch(m -> "US_PHONE".equals(m.type())));
            existing.setStructureName(agencyNameMap.getOrDefault(age, age));
        }

        existing.setLastScreeningDate(LocalDateTime.now());
        existing.setDetectionSource("AUTO_SCREENING");
        fatcaClientRepository.save(existing);

        if (indiciaChanged) {
            String cli = getString(record, "cli");
            fatcaAuditService.logReview(cli, "INDICIA_UPDATED", "SYSTEM",
                "Indices mis à jour: " + newIndiciaTypes);
        }

        return indiciaChanged;
    }

    private String calculateRiskLevel(List<IndiciaMatch> matches) {
        int count = matches.size();
        if (count >= 4) return "CRITICAL";
        if (count >= 3) return "HIGH";
        if (count >= 2) return "MEDIUM";
        return "LOW";
    }

    private String buildClientName(Map<String, Object> record) {
        String nom = getString(record, "nom");
        String pre = getString(record, "pre");
        String rso = getString(record, "rso");

        StringBuilder name = new StringBuilder();
        if (nom != null) name.append(nom);
        if (pre != null && !pre.isEmpty()) {
            if (name.length() > 0) name.append(" ");
            name.append(pre);
        }
        if (name.length() == 0 && rso != null) {
            name.append(rso);
        }
        return name.toString();
    }

    private String getString(Map<String, Object> record, String key) {
        Object val = record.get(key);
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private Map<String, String> loadAgencyNameMap() {
        return structureService.getAgencyNameMap();
    }

    public record ScreeningResult(int totalScanned, int newDetections, int updated, int errors) {}

    public record IndiciaMatch(String type, String fieldName, String fieldValue, String description) {}
}
