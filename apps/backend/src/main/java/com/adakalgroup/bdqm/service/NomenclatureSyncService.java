package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.NomenclatureSyncResultDto;
import com.adakalgroup.bdqm.model.NomenclatureEntry;
import com.adakalgroup.bdqm.model.NomenclatureType;
import com.adakalgroup.bdqm.repository.NomenclatureEntryRepository;
import com.adakalgroup.bdqm.repository.NomenclatureTypeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class NomenclatureSyncService {

    private final JdbcTemplate informixJdbcTemplate;
    private final NomenclatureTypeRepository nomenclatureTypeRepository;
    private final NomenclatureEntryRepository nomenclatureEntryRepository;

    public NomenclatureSyncService(
            @Qualifier("informixJdbcTemplate") JdbcTemplate informixJdbcTemplate,
            NomenclatureTypeRepository nomenclatureTypeRepository,
            NomenclatureEntryRepository nomenclatureEntryRepository) {
        this.informixJdbcTemplate = informixJdbcTemplate;
        this.nomenclatureTypeRepository = nomenclatureTypeRepository;
        this.nomenclatureEntryRepository = nomenclatureEntryRepository;
    }

    @Transactional
    public List<NomenclatureSyncResultDto> syncAll() {
        log.info("Starting full nomenclature sync from CBS bknom...");
        List<NomenclatureType> types = nomenclatureTypeRepository.findBySyncEnabledTrueAndActiveTrue();
        List<NomenclatureSyncResultDto> results = new ArrayList<>();

        for (NomenclatureType type : types) {
            try {
                results.add(syncNomenclature(type));
            } catch (Exception e) {
                log.error("Error syncing nomenclature ctab={}: {}", type.getCtab(), e.getMessage());
                results.add(NomenclatureSyncResultDto.builder()
                        .ctab(type.getCtab())
                        .nomenclatureName(type.getDisplayName())
                        .errors(1)
                        .syncedAt(LocalDateTime.now())
                        .build());
            }
        }

        log.info("Nomenclature sync completed: {} types processed", results.size());
        return results;
    }

    @Transactional
    public NomenclatureSyncResultDto syncByCtab(String ctab) {
        NomenclatureType type = nomenclatureTypeRepository.findByCtab(ctab)
                .orElseThrow(() -> new IllegalArgumentException("Unknown nomenclature type: " + ctab));
        return syncNomenclature(type);
    }

    private NomenclatureSyncResultDto syncNomenclature(NomenclatureType type) {
        long start = System.currentTimeMillis();
        String ctab = type.getCtab();
        int inserted = 0, updated = 0, errors = 0;

        log.info("Syncing nomenclature ctab={} ({})", ctab, type.getDisplayName());

        String sql = "SELECT ctab, cacc, age, lib1, lib2, lib3, lib4, lib5, " +
                     "mnt1, mnt2, mnt3, mnt4, mnt5, mnt6, mnt7, mnt8, " +
                     "tau1, tau2, tau3, tau4, tau5 FROM bknom WHERE ctab = ?";
        List<Map<String, Object>> rows = informixJdbcTemplate.queryForList(sql, ctab);

        for (Map<String, Object> row : rows) {
            try {
                String cacc = getStringValue(row, "cacc");
                String age = getStringValue(row, "age");
                if (age == null || age.isBlank()) age = "00000";

                Optional<NomenclatureEntry> existing =
                        nomenclatureEntryRepository.findByCtabAndCaccAndAge(ctab, cacc, age);

                NomenclatureEntry entry = existing.orElseGet(NomenclatureEntry::new);
                boolean isNew = existing.isEmpty();

                entry.setNomenclatureType(type);
                entry.setCtab(ctab);
                entry.setCacc(cacc);
                entry.setAge(age);
                entry.setLib1(getStringValue(row, "lib1"));
                entry.setLib2(getStringValue(row, "lib2"));
                entry.setLib3(getStringValue(row, "lib3"));
                entry.setLib4(getStringValue(row, "lib4"));
                entry.setLib5(getStringValue(row, "lib5"));
                entry.setMnt1(getBigDecimalValue(row, "mnt1"));
                entry.setMnt2(getBigDecimalValue(row, "mnt2"));
                entry.setMnt3(getBigDecimalValue(row, "mnt3"));
                entry.setMnt4(getBigDecimalValue(row, "mnt4"));
                entry.setMnt5(getBigDecimalValue(row, "mnt5"));
                entry.setMnt6(getBigDecimalValue(row, "mnt6"));
                entry.setMnt7(getBigDecimalValue(row, "mnt7"));
                entry.setMnt8(getBigDecimalValue(row, "mnt8"));
                entry.setTau1(getBigDecimalValue(row, "tau1"));
                entry.setTau2(getBigDecimalValue(row, "tau2"));
                entry.setTau3(getBigDecimalValue(row, "tau3"));
                entry.setTau4(getBigDecimalValue(row, "tau4"));
                entry.setTau5(getBigDecimalValue(row, "tau5"));
                entry.setActive(true);
                entry.setLastSyncedAt(LocalDateTime.now());

                nomenclatureEntryRepository.save(entry);
                if (isNew) inserted++;
                else updated++;

            } catch (Exception e) {
                log.error("Error syncing nomenclature entry ctab={}: {}", ctab, e.getMessage());
                errors++;
            }
        }

        type.setEntryCount((int) nomenclatureEntryRepository.countByCtabAndActiveTrue(ctab));
        type.setLastSyncedAt(LocalDateTime.now());
        nomenclatureTypeRepository.save(type);

        long durationMs = System.currentTimeMillis() - start;
        log.info("Synced nomenclature ctab={}: {} inserted, {} updated, {} errors ({}ms)",
                ctab, inserted, updated, errors, durationMs);

        return NomenclatureSyncResultDto.builder()
                .ctab(ctab)
                .nomenclatureName(type.getDisplayName())
                .inserted(inserted)
                .updated(updated)
                .deleted(0)
                .errors(errors)
                .syncedAt(LocalDateTime.now())
                .durationMs(durationMs)
                .build();
    }

    /**
     * Discover nomenclature types from CBS bknom.
     * Returns distinct ctab values with sample labels and entry counts.
     */
    public List<Map<String, Object>> discoverNomenclatureTypes() {
        String sql = "SELECT DISTINCT ctab, FIRST 1 lib1 as sample_label, COUNT(*) as entry_count " +
                     "FROM bknom GROUP BY ctab ORDER BY ctab";
        return informixJdbcTemplate.queryForList(sql);
    }

    private String getStringValue(Map<String, Object> row, String key) {
        Object val = row.get(key);
        return val != null ? val.toString().trim() : null;
    }

    private BigDecimal getBigDecimalValue(Map<String, Object> row, String key) {
        Object val = row.get(key);
        if (val == null) return null;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        try {
            return new BigDecimal(val.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
