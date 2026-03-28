package com.bsic.dataqualitybackend.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.bsic.dataqualitybackend.service.CbsColumnRegistry;

import java.util.List;
import java.util.Map;

@Repository
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class InformixRepository {

    private final JdbcTemplate informixJdbcTemplate;

    public InformixRepository(@Qualifier("informixJdbcTemplate") JdbcTemplate informixJdbcTemplate) {
        this.informixJdbcTemplate = informixJdbcTemplate;
    }

    public boolean testConnection() {
        try {
            Integer result = informixJdbcTemplate.queryForObject(
                    "SELECT FIRST 1 1 FROM systables",
                    Integer.class
            );
            log.info("Informix connection test successful");
            return result != null;
        } catch (Exception e) {
            log.error("Informix connection test failed: {}", e.getMessage());
            return false;
        }
    }

    public Map<String, Object> getClientById(String clientId) {
        String sql = """
            SELECT FIRST 1
                cli as client_id,
                nom as name,
                pre as firstname,
                adr as address,
                vil as city,
                cpo as postal_code,
                tel as phone,
                ema as email,
                dna as birth_date,
                nat as nationality,
                tcli as client_type,
                sta_fat as fatca_status
            FROM bkcli
            WHERE cli = ?
        """;

        try {
            return informixJdbcTemplate.queryForMap(sql, clientId);
        } catch (Exception e) {
            log.error("Error fetching client {} from CBS: {}", clientId, e.getMessage());
            throw new RuntimeException("Client not found in CBS", e);
        }
    }

    public List<Map<String, Object>> searchClients(String searchTerm, int limit) {
        String sql = """
            SELECT FIRST ?
                cli as client_id,
                nom as name,
                pre as firstname,
                adr as address,
                tel as phone,
                ema as email,
                tcli as client_type
            FROM bkcli
            WHERE nom LIKE ? OR pre LIKE ? OR cli LIKE ?
            ORDER BY nom, pre
        """;

        String pattern = "%" + searchTerm + "%";
        return informixJdbcTemplate.queryForList(sql, limit, pattern, pattern, pattern);
    }

    public Long getTotalClientsCount() {
        String sql = "SELECT COUNT(*) FROM bkcli";
        return informixJdbcTemplate.queryForObject(sql, Long.class);
    }

    public Map<String, Long> getClientStatistics() {
        String sql = """
            SELECT
                tcli as client_type,
                COUNT(*) as count
            FROM bkcli
            GROUP BY tcli
        """;

        List<Map<String, Object>> results = informixJdbcTemplate.queryForList(sql);
        return results.stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> String.valueOf(row.get("client_type")),
                        row -> ((Number) row.get("count")).longValue()
                ));
    }

    public List<Map<String, Object>> getAnomalousClients(int limit) {
        String sql = """
            SELECT FIRST ?
                cli as client_id,
                nom as name,
                pre as firstname,
                adr as address,
                tcli as client_type,
                CASE
                    WHEN nom IS NULL OR TRIM(nom) = '' THEN 'Nom manquant'
                    WHEN pre IS NULL OR TRIM(pre) = '' THEN 'Prénom manquant'
                    WHEN adr IS NULL OR TRIM(adr) = '' THEN 'Adresse manquante'
                    WHEN tel IS NULL OR TRIM(tel) = '' THEN 'Téléphone manquant'
                    WHEN ema IS NULL OR TRIM(ema) = '' THEN 'Email manquant'
                    ELSE 'Autre anomalie'
                END as anomaly_type
            FROM bkcli
            WHERE
                nom IS NULL OR TRIM(nom) = '' OR
                pre IS NULL OR TRIM(pre) = '' OR
                adr IS NULL OR TRIM(adr) = '' OR
                tel IS NULL OR TRIM(tel) = '' OR
                ema IS NULL OR TRIM(ema) = ''
            ORDER BY cli
        """;

        return informixJdbcTemplate.queryForList(sql, limit);
    }

    public List<Map<String, Object>> getFatcaClients(String status, int limit) {
        String sql = """
            SELECT FIRST ?
                cli as client_id,
                nom as name,
                pre as firstname,
                nat as nationality,
                sta_fat as fatca_status,
                dat_fat as fatca_date,
                tcli as client_type
            FROM bkcli
            WHERE sta_fat = ?
            ORDER BY dat_fat DESC
        """;

        return informixJdbcTemplate.queryForList(sql, limit, status);
    }

    public boolean updateClient(String clientId, Map<String, Object> updates) {
        try {
            // Validate all column names against the whitelist before building SQL
            for (String column : updates.keySet()) {
                if (!CbsColumnRegistry.isAllowedColumn(column)) {
                    throw new IllegalArgumentException("Invalid CBS column name: " + column);
                }
            }

            StringBuilder sql = new StringBuilder("UPDATE bkcli SET ");
            List<Object> params = new java.util.ArrayList<>();

            boolean first = true;
            for (Map.Entry<String, Object> entry : updates.entrySet()) {
                if (!first) sql.append(", ");
                sql.append(entry.getKey()).append(" = ?");
                params.add(entry.getValue());
                first = false;
            }

            sql.append(" WHERE cli = ?");
            params.add(clientId);

            int rowsAffected = informixJdbcTemplate.update(sql.toString(), params.toArray());
            log.info("Updated client {} in CBS, rows affected: {}", clientId, rowsAffected);

            return rowsAffected > 0;
        } catch (Exception e) {
            log.error("Error updating client {} in CBS: {}", clientId, e.getMessage());
            throw new RuntimeException("Failed to update client in CBS", e);
        }
    }

    public Map<String, Object> executeCustomQuery(String sql, Object... params) {
        try {
            return informixJdbcTemplate.queryForMap(sql, params);
        } catch (Exception e) {
            log.error("Error executing custom query: {}", e.getMessage());
            throw new RuntimeException("Query execution failed", e);
        }
    }

    public List<Map<String, Object>> executeCustomQueryList(String sql, Object... params) {
        try {
            return informixJdbcTemplate.queryForList(sql, params);
        } catch (Exception e) {
            log.error("Error executing custom query: {}", e.getMessage());
            throw new RuntimeException("Query execution failed", e);
        }
    }

    /**
     * Fetch all clients from Informix BKCLI table for sync to MySQL.
     * Returns all fields needed for the Client entity.
     */
    public List<Map<String, Object>> getAllClients() {
        String sql = """
                select
                cli,
                nom,
                tcli,
                lib,
                pre,
                sext,
                njf,
                dna,
                viln,
                depn,
                payn,
                locn,
                tid,
                nid,
                did,
                lid,
                oid,
                vid,
                sit,
                reg,
                capj,
                dcapj,
                sitj,
                dsitj,
                tconj,
                conj,
                nbenf,
                clifam,
                rso,
                sig,
                datc,
                fju,
                nrc,
                vrc,
                nchc,
                npa,
                vpa,
                nidn,
                nis,
                nidf,
                grp,
                sgrp,
                met,
                smet,
                cmc1,
                cmc2,
                age,
                ges,
                qua,
                tax,
                catl,
                seg,
                nst,
                clipar,
                chl1,
                chl2,
                chl3,
                lter,
                lterc,
                resd,
                catn,
                sec,
                lienbq,
                aclas,
                maclas,
                emtit,
                nicr,
                ced,
                clcr,
                nmer,
                lang,
                nat,
                res,
                ichq,
                dichq,
                icb,
                dicb,
                epu,
                utic,
                uti,
                dou,
                dmo,
                ord,
                catr,
                midname,
                nomrest,
                drc,
                lrc,
                rso2,
                regn,
                rrc,
                dvrrc,
                uti_vrrc
        from bank.bkcli
         limit 10
        """;

        try {
            log.info("Fetching all clients from Informix CBS...");
            List<Map<String, Object>> clients = informixJdbcTemplate.queryForList(sql);
            log.info("Fetched {} clients from Informix CBS", clients.size());
            return clients;
        } catch (Exception e) {
            log.error("Error fetching all clients from CBS: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch clients from CBS", e);
        }
    }

    /**
     * Fetch clients from Informix BKCLI table in batches for large datasets.
     * @param offset Starting row offset
     * @param limit Maximum number of rows to fetch
     */
    public List<Map<String, Object>> getClientsBatch(int offset, int limit) {
        String sql = """
                select
                cli,
                nom,
                tcli,
                lib,
                pre,
                sext,
                njf,
                dna,
                viln,
                depn,
                payn,
                locn,
                tid,
                nid,
                did,
                lid,
                oid,
                vid,
                sit,
                reg,
                capj,
                dcapj,
                sitj,
                dsitj,
                tconj,
                conj,
                nbenf,
                clifam,
                rso,
                sig,
                datc,
                fju,
                nrc,
                vrc,
                nchc,
                npa,
                vpa,
                nidn,
                nis,
                nidf,
                grp,
                sgrp,
                met,
                smet,
                cmc1,
                cmc2,
                age,
                ges,
                qua,
                tax,
                catl,
                seg,
                nst,
                clipar,
                chl1,
                chl2,
                chl3,
                lter,
                lterc,
                resd,
                catn,
                sec,
                lienbq,
                aclas,
                maclas,
                emtit,
                nicr,
                ced,
                clcr,
                nmer,
                lang,
                nat,
                res,
                ichq,
                dichq,
                icb,
                dicb,
                epu,
                utic,
                uti,
                dou,
                dmo,
                ord,
                catr,
                midname,
                nomrest,
                drc,
                lrc,
                rso2,
                regn,
                rrc,
                dvrrc,
                uti_vrrc
        from bkcli
        """;


        try {
            return informixJdbcTemplate.queryForList(sql, offset, limit);
        } catch (Exception e) {
            log.error("Error fetching clients batch (offset={}, limit={}): {}", offset, limit, e.getMessage());
            throw new RuntimeException("Failed to fetch clients batch from CBS", e);
        }
    }

    /**
     * Fetch all agencies from Informix BKAGE table for sync to MySQL.
     */
    public List<Map<String, Object>> getAllAgencies() {
        String sql = """
            SELECT
                age as code,
                lib as name
            FROM bkage
        """;

        try {
            log.info("Fetching all agencies from Informix CBS...");
            List<Map<String, Object>> agencies = informixJdbcTemplate.queryForList(sql);
            log.info("Fetched {} agencies from Informix CBS", agencies.size());
            return agencies;
        } catch (Exception e) {
            log.error("Error fetching all agencies from CBS: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch agencies from CBS", e);
        }
    }
}
