-- =====================================================
-- BSIC Ticket System Schema
-- For managing client data anomaly correction workflow
-- =====================================================

-- =====================================================
-- TICKET TABLES
-- =====================================================

-- Table des tickets (Main tickets table)
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  cli CHAR(15) NOT NULL,
  client_name VARCHAR(200),
  client_type CHAR(1),
  agency_code CHAR(5) NOT NULL,
  status ticket_status NOT NULL DEFAULT 'DETECTED',
  priority ticket_priority NOT NULL DEFAULT 'MEDIUM',
  assigned_to INTEGER,
  assigned_by INTEGER,
  assigned_at TIMESTAMP,
  validated_by INTEGER,
  validated_at TIMESTAMP,
  closed_by INTEGER,
  closed_at TIMESTAMP,
  sla_deadline TIMESTAMP,
  sla_breached BOOLEAN DEFAULT FALSE,
  total_incidents INTEGER DEFAULT 0,
  resolved_incidents INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_cli ON tickets(cli);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_agency_code ON tickets(agency_code);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_deadline ON tickets(sla_deadline);

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table des incidents de tickets (Ticket incidents table)
CREATE TABLE IF NOT EXISTS ticket_incidents (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  incident_type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  field_label VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_incidents_ticket_id ON ticket_incidents(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_incidents_type ON ticket_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_ticket_incidents_category ON ticket_incidents(category);
CREATE INDEX IF NOT EXISTS idx_ticket_incidents_status ON ticket_incidents(status);

CREATE TRIGGER update_ticket_incidents_updated_at BEFORE UPDATE ON ticket_incidents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table des commentaires de tickets (Ticket comments table)
CREATE TABLE IF NOT EXISTS ticket_comments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  comment_type VARCHAR(20) DEFAULT 'general',
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id ON ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);

-- Table des documents de tickets (Ticket documents table)
CREATE TABLE IF NOT EXISTS ticket_documents (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_path VARCHAR(500) NOT NULL,
  document_type VARCHAR(50),
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_documents_ticket_id ON ticket_documents(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_documents_uploaded_by ON ticket_documents(uploaded_by);

-- Table de l'historique des tickets (Ticket history table)
CREATE TABLE IF NOT EXISTS ticket_history (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL,
  previous_status ticket_status,
  new_status ticket_status,
  previous_value TEXT,
  new_value TEXT,
  performed_by INTEGER NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_performed_by ON ticket_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_ticket_history_timestamp ON ticket_history(timestamp);

-- =====================================================
-- SLA CONFIGURATION
-- =====================================================

-- Table de configuration des SLA (SLA configuration table)
CREATE TABLE IF NOT EXISTS sla_config (
  id SERIAL PRIMARY KEY,
  ticket_priority ticket_priority NOT NULL,
  department VARCHAR(50),
  resolution_hours INTEGER NOT NULL,
  escalation_hours INTEGER,
  notification_hours INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ticket_priority, department)
);

CREATE INDEX IF NOT EXISTS idx_sla_config_priority ON sla_config(ticket_priority);
CREATE INDEX IF NOT EXISTS idx_sla_config_department ON sla_config(department);

CREATE TRIGGER update_sla_config_updated_at BEFORE UPDATE ON sla_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default SLA configurations
INSERT INTO sla_config (ticket_priority, resolution_hours, escalation_hours, notification_hours) VALUES
('CRITICAL', 24, 12, 6),
('HIGH', 72, 48, 24),
('MEDIUM', 168, 120, 72),
('LOW', 336, 240, 168)
ON CONFLICT DO NOTHING;

-- =====================================================
-- KPI TRACKING
-- =====================================================

-- Table des KPIs de tickets (Ticket KPIs table)
CREATE TABLE IF NOT EXISTS ticket_kpis (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  agency_code CHAR(5),
  user_id INTEGER,
  total_tickets INTEGER DEFAULT 0,
  detected_tickets INTEGER DEFAULT 0,
  assigned_tickets INTEGER DEFAULT 0,
  in_progress_tickets INTEGER DEFAULT 0,
  pending_validation_tickets INTEGER DEFAULT 0,
  validated_tickets INTEGER DEFAULT 0,
  closed_tickets INTEGER DEFAULT 0,
  rejected_tickets INTEGER DEFAULT 0,
  sla_breached_tickets INTEGER DEFAULT 0,
  avg_resolution_time_hours DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agency_code, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_kpis_date ON ticket_kpis(date);
CREATE INDEX IF NOT EXISTS idx_ticket_kpis_agency_code ON ticket_kpis(agency_code);
CREATE INDEX IF NOT EXISTS idx_ticket_kpis_user_id ON ticket_kpis(user_id);

-- =====================================================
-- RPA INTEGRATION
-- =====================================================

-- Table des exécutions RPA (RPA execution log table)
CREATE TABLE IF NOT EXISTS rpa_execution_log (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  execution_id VARCHAR(100) UNIQUE,
  robot_name VARCHAR(100),
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running',
  success BOOLEAN,
  error_message TEXT,
  screenshot_path VARCHAR(500),
  execution_details JSONB,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rpa_execution_ticket_id ON rpa_execution_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_rpa_execution_status ON rpa_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_rpa_execution_start_time ON rpa_execution_log(start_time);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Vue des statistiques de tickets par agence
CREATE OR REPLACE VIEW vw_ticket_stats_by_agency AS
SELECT
  agency_code,
  COUNT(*) as total_tickets,
  SUM(CASE WHEN status = 'DETECTED' THEN 1 ELSE 0 END) as detected,
  SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned,
  SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN status = 'PENDING_VALIDATION' THEN 1 ELSE 0 END) as pending_validation,
  SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed,
  SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
  SUM(CASE WHEN sla_breached = TRUE THEN 1 ELSE 0 END) as sla_breached,
  ROUND(AVG(CASE WHEN closed_at IS NOT NULL THEN
    EXTRACT(EPOCH FROM (closed_at - created_at))/3600
  END), 2) as avg_resolution_hours
FROM tickets
GROUP BY agency_code;

-- Vue des statistiques de tickets par utilisateur
CREATE OR REPLACE VIEW vw_ticket_stats_by_user AS
SELECT
  u.id as user_id,
  u.username,
  u.full_name,
  u.agency_code,
  COUNT(t.id) as total_assigned,
  SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN t.status = 'CLOSED' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN t.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
  ROUND(AVG(CASE WHEN t.closed_at IS NOT NULL THEN
    EXTRACT(EPOCH FROM (t.closed_at - t.created_at))/3600
  END), 2) as avg_resolution_hours
FROM users u
LEFT JOIN tickets t ON t.assigned_to = u.id
WHERE u.role IN ('user', 'agency_user')
GROUP BY u.id, u.username, u.full_name, u.agency_code;

-- Vue des tickets en retard SLA
CREATE OR REPLACE VIEW vw_tickets_sla_breach AS
SELECT
  t.id,
  t.ticket_number,
  t.cli,
  t.client_name,
  t.agency_code,
  t.status,
  t.priority,
  t.assigned_to,
  u.username as assigned_to_name,
  t.created_at,
  t.sla_deadline,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.sla_deadline))/3600 as hours_overdue
FROM tickets t
LEFT JOIN users u ON u.id = t.assigned_to
WHERE t.sla_deadline < CURRENT_TIMESTAMP
  AND t.status NOT IN ('CLOSED', 'REJECTED')
ORDER BY hours_overdue DESC;

-- =====================================================
-- FUNCTIONS FOR TICKET MANAGEMENT
-- =====================================================

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
  ticket_num VARCHAR(50);
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM tickets
  WHERE ticket_number LIKE TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '%';

  ticket_num := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(next_num::TEXT, 6, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SLA deadline
CREATE OR REPLACE FUNCTION calculate_sla_deadline(p_priority ticket_priority, p_department VARCHAR)
RETURNS TIMESTAMP AS $$
DECLARE
  resolution_hours INTEGER;
BEGIN
  SELECT sc.resolution_hours INTO resolution_hours
  FROM sla_config sc
  WHERE sc.ticket_priority = p_priority
    AND (sc.department = p_department OR sc.department IS NULL)
    AND sc.active = TRUE
  ORDER BY sc.department NULLS LAST
  LIMIT 1;

  IF resolution_hours IS NULL THEN
    resolution_hours := 168;
  END IF;

  RETURN CURRENT_TIMESTAMP + (resolution_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Ticket system schema completed successfully
-- =====================================================
