-- ============================================
-- SCHEMA DE RÉCONCILIATION CBS
-- ============================================
-- Tables pour gérer le processus de réconciliation
-- entre les corrections appliquées et le CBS

-- Table des tâches de réconciliation
CREATE TABLE IF NOT EXISTS reconciliation_tasks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ticket_id VARCHAR(50) NOT NULL,
  client_id VARCHAR(50) NOT NULL,
  status ENUM('pending', 'reconciled', 'failed', 'partial') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reconciled_at TIMESTAMP NULL,
  last_attempt_at TIMESTAMP NULL,
  attempts INT DEFAULT 0,
  error_message TEXT NULL,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des corrections (extension)
-- Ajouter des colonnes pour stocker les valeurs CBS
ALTER TABLE corrections
  ADD COLUMN IF NOT EXISTS cbs_value VARCHAR(255) NULL COMMENT 'Valeur lue depuis le CBS',
  ADD COLUMN IF NOT EXISTS is_matched BOOLEAN DEFAULT FALSE COMMENT 'Indique si la valeur correspond',
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP NULL COMMENT 'Dernière vérification CBS';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_corrections_ticket_field
  ON corrections(ticket_id, field_name);

-- Vues pour faciliter les requêtes

-- Vue: Tâches de réconciliation avec détails
CREATE OR REPLACE VIEW v_reconciliation_details AS
SELECT
  rt.id,
  rt.ticket_id,
  rt.client_id,
  rt.status,
  rt.created_at,
  rt.reconciled_at,
  rt.last_attempt_at,
  rt.attempts,
  rt.error_message,
  a.client_name,
  a.agency_code,
  a.anomaly_type,
  COUNT(c.id) as total_corrections,
  SUM(CASE WHEN c.is_matched THEN 1 ELSE 0 END) as matched_corrections,
  ROUND(SUM(CASE WHEN c.is_matched THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as match_percentage
FROM reconciliation_tasks rt
LEFT JOIN tickets t ON t.ticket_number = rt.ticket_id
LEFT JOIN anomalies a ON a.id = t.anomaly_id
LEFT JOIN corrections c ON c.ticket_id = rt.ticket_id
GROUP BY rt.id;

-- Vue: Statistiques de réconciliation par agence
CREATE OR REPLACE VIEW v_reconciliation_stats_by_agency AS
SELECT
  a.agency_code,
  a.agency_name,
  COUNT(DISTINCT rt.id) as total_tasks,
  SUM(CASE WHEN rt.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
  SUM(CASE WHEN rt.status = 'reconciled' THEN 1 ELSE 0 END) as reconciled_tasks,
  SUM(CASE WHEN rt.status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
  SUM(CASE WHEN rt.status = 'partial' THEN 1 ELSE 0 END) as partial_tasks,
  ROUND(SUM(CASE WHEN rt.status = 'reconciled' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT rt.id), 2) as success_rate,
  AVG(TIMESTAMPDIFF(SECOND, rt.created_at, rt.reconciled_at)) as avg_reconciliation_time
FROM reconciliation_tasks rt
LEFT JOIN tickets t ON t.ticket_number = rt.ticket_id
LEFT JOIN anomalies a ON a.id = t.anomaly_id
GROUP BY a.agency_code, a.agency_name;

-- Vue: Écarts de réconciliation non résolus
CREATE OR REPLACE VIEW v_reconciliation_discrepancies AS
SELECT
  rt.id as task_id,
  rt.ticket_id,
  rt.client_id,
  a.client_name,
  a.agency_code,
  c.field_name,
  c.field_label,
  c.old_value,
  c.new_value as expected_value,
  c.cbs_value as actual_value,
  c.is_matched,
  c.last_checked_at,
  rt.status as task_status,
  rt.attempts
FROM reconciliation_tasks rt
LEFT JOIN tickets t ON t.ticket_number = rt.ticket_id
LEFT JOIN anomalies a ON a.id = t.anomaly_id
LEFT JOIN corrections c ON c.ticket_id = rt.ticket_id
WHERE rt.status IN ('failed', 'partial')
  AND c.is_matched = FALSE;

-- Procédure stockée: Créer une tâche de réconciliation
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_create_reconciliation_task(
  IN p_ticket_id VARCHAR(50),
  IN p_client_id VARCHAR(50)
)
BEGIN
  DECLARE task_exists INT;

  -- Vérifier si une tâche existe déjà pour ce ticket
  SELECT COUNT(*) INTO task_exists
  FROM reconciliation_tasks
  WHERE ticket_id = p_ticket_id;

  -- Créer la tâche seulement si elle n'existe pas
  IF task_exists = 0 THEN
    INSERT INTO reconciliation_tasks (ticket_id, client_id, status)
    VALUES (p_ticket_id, p_client_id, 'pending');

    SELECT LAST_INSERT_ID() as task_id;
  ELSE
    -- Retourner l'ID de la tâche existante
    SELECT id as task_id
    FROM reconciliation_tasks
    WHERE ticket_id = p_ticket_id
    LIMIT 1;
  END IF;
END //
DELIMITER ;

-- Procédure stockée: Mettre à jour le statut de réconciliation
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_update_reconciliation_status(
  IN p_task_id VARCHAR(36),
  IN p_status ENUM('pending', 'reconciled', 'failed', 'partial'),
  IN p_error_message TEXT
)
BEGIN
  UPDATE reconciliation_tasks
  SET
    status = p_status,
    last_attempt_at = CURRENT_TIMESTAMP,
    attempts = attempts + 1,
    error_message = p_error_message,
    reconciled_at = CASE
      WHEN p_status = 'reconciled' THEN CURRENT_TIMESTAMP
      ELSE reconciled_at
    END
  WHERE id = p_task_id;
END //
DELIMITER ;

-- Procédure stockée: Nettoyer les anciennes tâches réconciliées
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_cleanup_old_reconciliation_tasks(
  IN p_days INT
)
BEGIN
  -- Archiver les tâches anciennes (optionnel)
  -- CREATE TABLE IF NOT EXISTS reconciliation_tasks_archive LIKE reconciliation_tasks;

  -- INSERT INTO reconciliation_tasks_archive
  -- SELECT * FROM reconciliation_tasks
  -- WHERE status = 'reconciled'
  --   AND reconciled_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL p_days DAY);

  -- Supprimer les tâches archivées
  DELETE FROM reconciliation_tasks
  WHERE status = 'reconciled'
    AND reconciled_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL p_days DAY);

  SELECT ROW_COUNT() as deleted_count;
END //
DELIMITER ;

-- Trigger: Créer automatiquement une tâche de réconciliation après validation
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_create_reconciliation_after_approval
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
  -- Si le ticket passe à "approved", créer une tâche de réconciliation
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO reconciliation_tasks (ticket_id, client_id, status)
    SELECT NEW.ticket_number, a.client_id, 'pending'
    FROM anomalies a
    WHERE a.id = NEW.anomaly_id
    ON DUPLICATE KEY UPDATE status = 'pending';
  END IF;
END //
DELIMITER ;

-- Données initiales pour les tests
INSERT INTO reconciliation_tasks (ticket_id, client_id, status, created_at, attempts)
SELECT
  t.ticket_number,
  a.client_id,
  CASE
    WHEN RAND() < 0.3 THEN 'pending'
    WHEN RAND() < 0.7 THEN 'reconciled'
    WHEN RAND() < 0.9 THEN 'partial'
    ELSE 'failed'
  END as status,
  DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) as created_at,
  FLOOR(RAND() * 5) as attempts
FROM tickets t
INNER JOIN anomalies a ON a.id = t.anomaly_id
WHERE t.status = 'approved'
LIMIT 100
ON DUPLICATE KEY UPDATE id = id;

-- Mise à jour des corrections avec des valeurs CBS simulées
UPDATE corrections c
INNER JOIN tickets t ON t.ticket_number = c.ticket_id
SET
  c.cbs_value = CASE
    WHEN RAND() < 0.7 THEN c.new_value  -- 70% correspondent
    WHEN RAND() < 0.9 THEN CONCAT(c.new_value, ' (CBS)')  -- 20% proche
    ELSE c.old_value  -- 10% pas changé
  END,
  c.is_matched = (RAND() < 0.7),
  c.last_checked_at = DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY)
WHERE t.status = 'approved';

-- Statistiques finales
SELECT 'Reconciliation schema created successfully!' as message;
SELECT COUNT(*) as total_tasks FROM reconciliation_tasks;
SELECT status, COUNT(*) as count FROM reconciliation_tasks GROUP BY status;
