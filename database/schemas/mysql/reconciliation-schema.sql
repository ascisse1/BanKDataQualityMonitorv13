-- ===========================================
-- Tables pour la Réconciliation CBS
-- ===========================================

-- Table des tâches de réconciliation
CREATE TABLE IF NOT EXISTS reconciliation_tasks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ticket_id VARCHAR(20) NOT NULL,
    client_id VARCHAR(20) NOT NULL,
    status ENUM('pending', 'reconciled', 'partial', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reconciled_at TIMESTAMP NULL,
    attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    error_message TEXT NULL,
    INDEX idx_ticket (ticket_id),
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des corrections avec statut de réconciliation
ALTER TABLE corrections ADD COLUMN IF NOT EXISTS cbs_value VARCHAR(500) NULL;
ALTER TABLE corrections ADD COLUMN IF NOT EXISTS is_matched BOOLEAN DEFAULT FALSE;
ALTER TABLE corrections ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_corrections_ticket ON corrections(ticket_id);
CREATE INDEX IF NOT EXISTS idx_corrections_matched ON corrections(is_matched);

-- Vue pour les statistiques de réconciliation
CREATE OR REPLACE VIEW reconciliation_stats AS
SELECT
    DATE(rt.created_at) as date,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN rt.status = 'reconciled' THEN 1 END) as reconciled,
    COUNT(CASE WHEN rt.status = 'partial' THEN 1 END) as partial,
    COUNT(CASE WHEN rt.status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN rt.status = 'pending' THEN 1 END) as pending,
    ROUND(AVG(TIMESTAMPDIFF(SECOND, rt.created_at, rt.reconciled_at)), 2) as avg_time_seconds
FROM reconciliation_tasks rt
GROUP BY DATE(rt.created_at)
ORDER BY date DESC;

-- Table d'audit pour les réconciliations
CREATE TABLE IF NOT EXISTS reconciliation_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    matched_fields INT DEFAULT 0,
    total_fields INT DEFAULT 0,
    discrepancies JSON NULL,
    performed_by VARCHAR(50) NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task (task_id),
    INDEX idx_performed (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
