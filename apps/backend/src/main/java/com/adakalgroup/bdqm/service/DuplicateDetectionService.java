package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.*;
import com.adakalgroup.bdqm.model.DuplicateMatch;
import com.adakalgroup.bdqm.model.enums.DuplicateMatchStatus;
import com.adakalgroup.bdqm.repository.DuplicateMatchRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DuplicateDetectionService {

    private static final String CBS_TABLE = "cbs.bkcli";
    private static final double DETECTION_THRESHOLD = 60.0;
    private static final int DEFAULT_BATCH_SIZE = 1000;

    private static final Map<String, Double> INDIVIDUAL_WEIGHTS = Map.of(
            "nom", 0.20,
            "pre", 0.10,
            "nid", 0.25,
            "dna", 0.15,
            "nmer", 0.10,
            "tel", 0.10,
            "ema", 0.05,
            "adr", 0.05
    );

    private static final Map<String, Double> CORPORATE_WEIGHTS = Map.of(
            "nom", 0.20,
            "rso", 0.15,
            "nrc", 0.30,
            "tel", 0.15,
            "fju", 0.10,
            "ema", 0.10
    );

    private final DuplicateMatchRepository repository;
    private final DSLContext primaryDsl;
    private final ObjectMapper objectMapper;

    public DuplicateDetectionService(
            DuplicateMatchRepository repository,
            @Qualifier("primaryDsl") DSLContext primaryDsl) {
        this.repository = repository;
        this.primaryDsl = primaryDsl;
        this.objectMapper = new ObjectMapper();
    }

    // ── Detection ─────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> runDetection(String clientType, int batchSize) {
        if (batchSize <= 0) batchSize = DEFAULT_BATCH_SIZE;

        String tcliCode = "individual".equalsIgnoreCase(clientType) ? "1" : "2";
        String normalizedType = "1".equals(tcliCode) ? "individual" : "corporate";

        log.info("Starting duplicate detection for type={}, batchSize={}", normalizedType, batchSize);

        List<Map<String, Object>> clients = fetchClientsFromMirror(tcliCode, batchSize);
        log.info("Fetched {} clients from CBS mirror", clients.size());

        if (clients.size() < 2) {
            return Map.of("detected", 0, "processed", clients.size());
        }

        // Blocking phase: group by blocking keys to avoid O(n^2)
        Map<String, List<Map<String, Object>>> blocks = buildBlocks(clients, normalizedType);

        int detected = 0;
        int comparisons = 0;

        for (List<Map<String, Object>> block : blocks.values()) {
            if (block.size() < 2) continue;

            for (int i = 0; i < block.size(); i++) {
                for (int j = i + 1; j < block.size(); j++) {
                    comparisons++;
                    Map<String, Object> c1 = block.get(i);
                    Map<String, Object> c2 = block.get(j);

                    double score = calculateWeightedScore(c1, c2, normalizedType);
                    if (score >= DETECTION_THRESHOLD) {
                        boolean created = createMatchRecord(c1, c2, score, normalizedType);
                        if (created) detected++;
                    }
                }
            }
        }

        log.info("Detection complete: {} duplicates detected, {} comparisons, {} clients processed",
                detected, comparisons, clients.size());

        return Map.of("detected", detected, "processed", clients.size());
    }

    public List<DuplicateCandidateDto> detectDuplicates(String clientType, Double minScore) {
        List<DuplicateMatch> matches;

        if (clientType != null && minScore != null) {
            matches = repository.findBySimilarityScoreGreaterThanEqualAndClientType(minScore, clientType);
        } else if (clientType != null) {
            matches = repository.findByClientType(clientType);
        } else if (minScore != null) {
            matches = repository.findBySimilarityScoreGreaterThanEqual(minScore);
        } else {
            matches = repository.findAll();
        }

        return matches.stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── CRUD / Workflow ───────────────────────────────────────────────

    public List<DuplicateCandidateDto> getPendingDuplicates(String clientType) {
        List<DuplicateMatch> matches;
        if (clientType != null && !clientType.isEmpty()) {
            matches = repository.findByStatusAndClientType(DuplicateMatchStatus.PENDING, clientType);
        } else {
            matches = repository.findByStatus(DuplicateMatchStatus.PENDING);
        }
        return matches.stream().map(this::toDto).collect(Collectors.toList());
    }

    public DuplicateDetailDto getDuplicateDetail(Long id) {
        DuplicateMatch match = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Duplicate match not found: " + id));

        Map<String, Object> client1Data = fetchClientById(match.getClientId1());
        Map<String, Object> client2Data = fetchClientById(match.getClientId2());

        SimilarityAnalysisDto analysis = buildSimilarityAnalysis(client1Data, client2Data, match.getClientType());

        return DuplicateDetailDto.builder()
                .client1(toClientDetailsDto(client1Data))
                .client2(toClientDetailsDto(client2Data))
                .similarityAnalysis(analysis)
                .build();
    }

    @Transactional
    public void confirmDuplicate(Long id, String userId, String comments) {
        DuplicateMatch match = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Duplicate match not found: " + id));
        match.setStatus(DuplicateMatchStatus.CONFIRMED);
        match.setReviewedBy(userId);
        match.setReviewedAt(LocalDateTime.now());
        match.setReviewComments(comments);
        repository.save(match);
        log.info("Duplicate {} confirmed by {}", id, userId);
    }

    @Transactional
    public void rejectDuplicate(Long id, String userId, String reason) {
        DuplicateMatch match = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Duplicate match not found: " + id));
        match.setStatus(DuplicateMatchStatus.REJECTED);
        match.setReviewedBy(userId);
        match.setReviewedAt(LocalDateTime.now());
        match.setReviewComments(reason);
        repository.save(match);
        log.info("Duplicate {} rejected by {}", id, userId);
    }

    @Transactional
    public void mergeDuplicate(Long id, String keepClientId, String mergeClientId,
                               String userId, String comments) {
        DuplicateMatch match = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Duplicate match not found: " + id));
        match.setStatus(DuplicateMatchStatus.MERGED);
        match.setReviewedBy(userId);
        match.setReviewedAt(LocalDateTime.now());
        match.setReviewComments(String.format("Merge: keep=%s, merge=%s. %s",
                keepClientId, mergeClientId, comments != null ? comments : ""));
        repository.save(match);
        log.info("Duplicate {} merged by {} (keep={}, merge={})", id, userId, keepClientId, mergeClientId);
    }

    public DuplicateStatsDto getStats() {
        long total = repository.count();
        long pending = repository.countByStatus(DuplicateMatchStatus.PENDING);
        long confirmed = repository.countByStatus(DuplicateMatchStatus.CONFIRMED);
        long rejected = repository.countByStatus(DuplicateMatchStatus.REJECTED);
        long merged = repository.countByStatus(DuplicateMatchStatus.MERGED);
        long highConfidence = repository.countBySimilarityScoreGreaterThanEqual(75.0);

        long individualCount = repository.countByClientType("individual");
        long corporateCount = repository.countByClientType("corporate");

        return DuplicateStatsDto.builder()
                .totalDuplicates(total)
                .pendingReview(pending)
                .confirmed(confirmed)
                .rejected(rejected)
                .merged(merged)
                .byType(Map.of("individual", individualCount, "corporate", corporateCount))
                .highConfidence(highConfidence)
                .build();
    }

    // ── Private: Data Access ──────────────────────────────────────────

    private List<Map<String, Object>> fetchClientsFromMirror(String tcliCode, int limit) {
        try {
            return primaryDsl
                    .select(
                            DSL.field("cli"), DSL.field("nom"), DSL.field("pre"),
                            DSL.field("nmer"), DSL.field("dna"), DSL.field("nid"),
                            DSL.field("tel"), DSL.field("ema"), DSL.field("adr"),
                            DSL.field("sext"), DSL.field("nat"), DSL.field("age"),
                            DSL.field("nrc"), DSL.field("rso"), DSL.field("fju"),
                            DSL.field("datc"), DSL.field("tcli")
                    )
                    .from(DSL.table(CBS_TABLE))
                    .where(DSL.field("tcli").eq(tcliCode))
                    .limit(limit)
                    .fetchMaps();
        } catch (Exception e) {
            log.error("Error fetching clients from CBS mirror: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private Map<String, Object> fetchClientById(String clientId) {
        try {
            Map<String, Object> result = primaryDsl
                    .select(
                            DSL.field("cli"), DSL.field("nom"), DSL.field("pre"),
                            DSL.field("nmer"), DSL.field("dna"), DSL.field("nid"),
                            DSL.field("tel"), DSL.field("ema"), DSL.field("adr"),
                            DSL.field("sext"), DSL.field("nat"), DSL.field("age"),
                            DSL.field("nrc"), DSL.field("rso"), DSL.field("fju"),
                            DSL.field("datc"), DSL.field("tcli")
                    )
                    .from(DSL.table(CBS_TABLE))
                    .where(DSL.field("cli").eq(clientId))
                    .fetchOneMap();

            return result != null ? result : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Error fetching client {}: {}", clientId, e.getMessage());
            return Collections.emptyMap();
        }
    }

    // ── Private: Blocking ─────────────────────────────────────────────

    private Map<String, List<Map<String, Object>>> buildBlocks(
            List<Map<String, Object>> clients, String clientType) {

        Map<String, List<Map<String, Object>>> blocks = new HashMap<>();

        for (Map<String, Object> client : clients) {
            Set<String> keys = generateBlockingKeys(client, clientType);
            for (String key : keys) {
                blocks.computeIfAbsent(key, k -> new ArrayList<>()).add(client);
            }
        }

        return blocks;
    }

    private Set<String> generateBlockingKeys(Map<String, Object> client, String clientType) {
        Set<String> keys = new HashSet<>();

        String nom = normalizeString(getString(client, "nom"));
        if (nom.length() >= 3) {
            keys.add("nom:" + nom.substring(0, 3));
        }

        String nid = getString(client, "nid").trim();
        if (!nid.isEmpty()) {
            keys.add("nid:" + nid);
        }

        String tel = getString(client, "tel").replaceAll("[^0-9]", "");
        if (tel.length() >= 6) {
            keys.add("tel:" + tel);
        }

        if ("individual".equals(clientType)) {
            String dna = getString(client, "dna").trim();
            if (!dna.isEmpty()) {
                keys.add("dna:" + dna);
            }
        } else {
            String nrc = getString(client, "nrc").trim();
            if (!nrc.isEmpty()) {
                keys.add("nrc:" + nrc);
            }
        }

        return keys;
    }

    // ── Private: Scoring ──────────────────────────────────────────────

    private double calculateWeightedScore(Map<String, Object> c1, Map<String, Object> c2, String clientType) {
        Map<String, Double> weights = "individual".equals(clientType) ? INDIVIDUAL_WEIGHTS : CORPORATE_WEIGHTS;
        double totalScore = 0.0;

        for (Map.Entry<String, Double> entry : weights.entrySet()) {
            String field = entry.getKey();
            double weight = entry.getValue();
            String v1 = getString(c1, field);
            String v2 = getString(c2, field);

            double fieldScore = calculateSimilarity(v1, v2);
            totalScore += fieldScore * weight;
        }

        return Math.round(totalScore * 100.0) / 100.0;
    }

    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0;

        String n1 = normalizeString(s1);
        String n2 = normalizeString(s2);

        if (n1.isEmpty() && n2.isEmpty()) return 0;
        if (n1.isEmpty() || n2.isEmpty()) return 0;
        if (n1.equals(n2)) return 100.0;

        int distance = levenshteinDistance(n1, n2);
        int maxLen = Math.max(n1.length(), n2.length());
        return ((double) (maxLen - distance) / maxLen) * 100.0;
    }

    private int levenshteinDistance(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();
        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) dp[i][0] = i;
        for (int j = 0; j <= len2; j++) dp[0][j] = j;

        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[len1][len2];
    }

    // ── Private: Similarity Analysis ──────────────────────────────────

    private SimilarityAnalysisDto buildSimilarityAnalysis(
            Map<String, Object> c1, Map<String, Object> c2, String clientType) {

        Map<String, Double> weights = "individual".equals(clientType) ? INDIVIDUAL_WEIGHTS : CORPORATE_WEIGHTS;

        List<FieldScoreDto> fieldScores = new ArrayList<>();
        List<String> matchingFields = new ArrayList<>();
        double overallScore = 0.0;

        for (Map.Entry<String, Double> entry : weights.entrySet()) {
            String field = entry.getKey();
            double weight = entry.getValue();
            String v1 = getString(c1, field);
            String v2 = getString(c2, field);
            double score = calculateSimilarity(v1, v2);

            fieldScores.add(FieldScoreDto.builder()
                    .field(field)
                    .score(Math.round(score * 100.0) / 100.0)
                    .value1(v1)
                    .value2(v2)
                    .build());

            if (score >= 80.0) {
                matchingFields.add(field);
            }
            overallScore += score * weight;
        }

        List<String> suspiciousPatterns = detectSuspiciousPatterns(c1, c2, clientType);

        return SimilarityAnalysisDto.builder()
                .overallScore(Math.round(overallScore * 100.0) / 100.0)
                .fieldScores(fieldScores)
                .matchingFields(matchingFields)
                .suspiciousPatterns(suspiciousPatterns)
                .build();
    }

    private List<String> detectSuspiciousPatterns(
            Map<String, Object> c1, Map<String, Object> c2, String clientType) {

        List<String> patterns = new ArrayList<>();

        // Same ID number but different name
        String nid1 = getString(c1, "nid").trim();
        String nid2 = getString(c2, "nid").trim();
        if (!nid1.isEmpty() && nid1.equals(nid2)) {
            String nom1 = normalizeString(getString(c1, "nom"));
            String nom2 = normalizeString(getString(c2, "nom"));
            if (!nom1.equals(nom2)) {
                patterns.add("Meme numero d'identite avec des noms differents - fraude possible");
            }
        }

        // Same phone for different clients
        String tel1 = getString(c1, "tel").replaceAll("[^0-9]", "");
        String tel2 = getString(c2, "tel").replaceAll("[^0-9]", "");
        if (!tel1.isEmpty() && tel1.equals(tel2)) {
            patterns.add("Numero de telephone partage entre clients differents");
        }

        // Same person at different agencies
        String age1 = getString(c1, "age").trim();
        String age2 = getString(c2, "age").trim();
        if (!age1.isEmpty() && !age2.isEmpty() && !age1.equals(age2)) {
            String nom1 = normalizeString(getString(c1, "nom"));
            String nom2 = normalizeString(getString(c2, "nom"));
            if (nom1.equals(nom2) && calculateSimilarity(
                    getString(c1, "pre"), getString(c2, "pre")) >= 80) {
                patterns.add("Meme personne dans des agences differentes (" + age1 + " / " + age2 + ")");
            }
        }

        // Corporate: same RCCM with different names
        if ("corporate".equals(clientType)) {
            String nrc1 = getString(c1, "nrc").trim();
            String nrc2 = getString(c2, "nrc").trim();
            if (!nrc1.isEmpty() && nrc1.equals(nrc2)) {
                String nom1 = normalizeString(getString(c1, "nom"));
                String nom2 = normalizeString(getString(c2, "nom"));
                if (!nom1.equals(nom2)) {
                    patterns.add("Meme RCCM avec des raisons sociales differentes");
                }
            }
        }

        return patterns;
    }

    // ── Private: Record Creation ──────────────────────────────────────

    private boolean createMatchRecord(Map<String, Object> c1, Map<String, Object> c2,
                                      double score, String clientType) {
        String id1 = getString(c1, "cli").trim();
        String id2 = getString(c2, "cli").trim();

        // Ensure ordered pair to prevent duplicate entries
        if (id1.compareTo(id2) > 0) {
            String tmp = id1; id1 = id2; id2 = tmp;
            Map<String, Object> tmpMap = c1; c1 = c2; c2 = tmpMap;
        }

        if (repository.existsByClientId1AndClientId2(id1, id2)) {
            return false;
        }

        Map<String, Double> weights = "individual".equals(clientType) ? INDIVIDUAL_WEIGHTS : CORPORATE_WEIGHTS;
        List<String> matchingFields = new ArrayList<>();
        for (String field : weights.keySet()) {
            double fieldScore = calculateSimilarity(getString(c1, field), getString(c2, field));
            if (fieldScore >= 80.0) {
                matchingFields.add(field);
            }
        }

        String matchingFieldsJson;
        try {
            matchingFieldsJson = objectMapper.writeValueAsString(matchingFields);
        } catch (JsonProcessingException e) {
            matchingFieldsJson = "[]";
        }

        DuplicateMatch match = DuplicateMatch.builder()
                .clientId1(id1)
                .clientId2(id2)
                .clientName1(getString(c1, "nom").trim())
                .clientName2(getString(c2, "nom").trim())
                .similarityScore(score)
                .matchingFields(matchingFieldsJson)
                .clientType(clientType)
                .structureCode(getString(c1, "age").trim())
                .build();

        repository.save(match);
        return true;
    }

    // ── Private: DTO Mapping ──────────────────────────────────────────

    private DuplicateCandidateDto toDto(DuplicateMatch match) {
        List<String> fields;
        try {
            fields = objectMapper.readValue(
                    match.getMatchingFields() != null ? match.getMatchingFields() : "[]",
                    new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            fields = Collections.emptyList();
        }

        return DuplicateCandidateDto.builder()
                .id(String.valueOf(match.getId()))
                .clientId1(match.getClientId1())
                .clientId2(match.getClientId2())
                .clientName1(match.getClientName1())
                .clientName2(match.getClientName2())
                .similarityScore(match.getSimilarityScore())
                .matchingFields(fields)
                .clientType(match.getClientType())
                .status(match.getStatus().name().toLowerCase())
                .createdAt(match.getCreatedAt() != null ? match.getCreatedAt().toString() : null)
                .reviewedAt(match.getReviewedAt() != null ? match.getReviewedAt().toString() : null)
                .reviewedBy(match.getReviewedBy())
                .build();
    }

    private ClientDetailsDto toClientDetailsDto(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return ClientDetailsDto.builder().build();
        }
        return ClientDetailsDto.builder()
                .id(getString(data, "cli"))
                .nom(getString(data, "nom"))
                .pre(getString(data, "pre"))
                .nid(getString(data, "nid"))
                .dna(getString(data, "dna"))
                .tel(getString(data, "tel"))
                .email(getString(data, "ema"))
                .adr(getString(data, "adr"))
                .nomMere(getString(data, "nmer"))
                .rccm(getString(data, "nrc"))
                .raisonSociale(getString(data, "rso"))
                .formeJuridique(getString(data, "fju"))
                .numCompte(getString(data, "cli"))
                .agence(getString(data, "age"))
                .createdAt(getString(data, "datc"))
                .build();
    }

    // ── Private: Utilities ────────────────────────────────────────────

    private String normalizeString(String str) {
        if (str == null) return "";
        return Normalizer.normalize(str.toLowerCase().trim(), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }
}
