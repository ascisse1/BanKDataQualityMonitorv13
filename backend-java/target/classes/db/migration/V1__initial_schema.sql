-- =====================================================
-- PostgreSQL Schema for BSIC Data Quality Monitor
-- Converted from MySQL schema
-- =====================================================

-- =====================================================
-- ENUMS / CUSTOM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'auditor', 'user', 'agency_user');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'locked');
CREATE TYPE anomaly_status AS ENUM ('detected', 'in_review', 'fixed', 'rejected');
CREATE TYPE load_status AS ENUM ('success', 'warning', 'error');
CREATE TYPE ticket_status AS ENUM ('DETECTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VALIDATION', 'VALIDATED', 'UPDATED_CBS', 'CLOSED', 'REJECTED');
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- =====================================================
-- TRIGGER FUNCTION for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. MAIN BANKING TABLES
-- =====================================================

-- Table des clients (Main client table)
CREATE TABLE IF NOT EXISTS bkcli (
  cli CHAR(15) PRIMARY KEY,
  nom VARCHAR(100),
  tcli CHAR(1),
  pre VARCHAR(100),
  nid VARCHAR(30),
  nmer VARCHAR(100),
  dna DATE,
  nat CHAR(3),
  age CHAR(5),
  sext CHAR(1),
  viln VARCHAR(50),
  payn CHAR(3),
  tid CHAR(3),
  vid DATE,
  nrc VARCHAR(30),
  datc DATE,
  rso VARCHAR(100),
  sig VARCHAR(30),
  sec VARCHAR(50),
  fju VARCHAR(50),
  catn VARCHAR(50),
  lienbq VARCHAR(50),
  dou DATE,
  clifam CHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bkcli_tcli ON bkcli(tcli);
CREATE INDEX IF NOT EXISTS idx_bkcli_age ON bkcli(age);
CREATE INDEX IF NOT EXISTS idx_bkcli_nat ON bkcli(nat);
CREATE INDEX IF NOT EXISTS idx_bkcli_payn ON bkcli(payn);

CREATE TRIGGER update_bkcli_updated_at BEFORE UPDATE ON bkcli
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table des comptes (Accounts table)
CREATE TABLE IF NOT EXISTS bkcom (
  cli CHAR(15) NOT NULL,
  cha CHAR(6) NOT NULL,
  dev CHAR(3) NOT NULL,
  age CHAR(5) NOT NULL,
  ncp CHAR(11) NOT NULL,
  cfe CHAR(1),
  PRIMARY KEY (cli, cha, dev, age, ncp),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bkcom_cli ON bkcom(cli);
CREATE INDEX IF NOT EXISTS idx_bkcom_cha ON bkcom(cha);

-- Table des adresses clients (Client addresses table)
CREATE TABLE IF NOT EXISTS bkadcli (
  cli CHAR(15) NOT NULL,
  typ CHAR(2) NOT NULL,
  adr1 VARCHAR(100),
  adr2 VARCHAR(100),
  adr3 VARCHAR(100),
  ville VARCHAR(50),
  cpay CHAR(3),
  PRIMARY KEY (cli, typ),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bkadcli_cli ON bkadcli(cli);
CREATE INDEX IF NOT EXISTS idx_bkadcli_cpay ON bkadcli(cpay);

-- Table des téléphones clients (Client phones table)
CREATE TABLE IF NOT EXISTS bktelcli (
  cli CHAR(15) NOT NULL,
  typ CHAR(3) NOT NULL,
  num VARCHAR(30),
  PRIMARY KEY (cli, typ),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bktelcli_cli ON bktelcli(cli);
CREATE INDEX IF NOT EXISTS idx_bktelcli_num ON bktelcli(num);

-- Table des emails clients (Client emails table)
CREATE TABLE IF NOT EXISTS bkemacli (
  cli CHAR(15) NOT NULL,
  email VARCHAR(100) NOT NULL,
  PRIMARY KEY (cli, email),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bkemacli_cli ON bkemacli(cli);

-- Table des co-titulaires (Joint account holders table)
CREATE TABLE IF NOT EXISTS bkcoj (
  clip CHAR(15) NOT NULL,
  ord INTEGER NOT NULL,
  cli CHAR(15),
  nom VARCHAR(100),
  pre VARCHAR(100),
  PRIMARY KEY (clip, ord),
  FOREIGN KEY (clip) REFERENCES bkcli(cli) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bkcoj_clip ON bkcoj(clip);
CREATE INDEX IF NOT EXISTS idx_bkcoj_cli ON bkcoj(cli);

-- Table des mandataires (Proxy holders table)
CREATE TABLE IF NOT EXISTS bkpscm (
  cli CHAR(15) NOT NULL,
  ord INTEGER NOT NULL,
  clim CHAR(15),
  nom VARCHAR(100),
  pre VARCHAR(100),
  PRIMARY KEY (cli, ord),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bkpscm_cli ON bkpscm(cli);
CREATE INDEX IF NOT EXISTS idx_bkpscm_clim ON bkpscm(clim);

-- =====================================================
-- 2. USERS AND AUTHENTICATION
-- =====================================================

-- Table des utilisateurs (Users table)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role user_role NOT NULL DEFAULT 'user',
  department VARCHAR(50),
  agency_code CHAR(5),
  status user_status NOT NULL DEFAULT 'active',
  last_login TIMESTAMP NULL,
  failed_login_attempts INTEGER DEFAULT 0,
  ldap_dn VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_agency_code ON users(agency_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table d'audit des utilisateurs (User audit log table)
CREATE TABLE IF NOT EXISTS user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_audit_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_created_at ON user_audit_log(created_at);

-- =====================================================
-- 3. FATCA TABLES
-- =====================================================

-- Table des clients FATCA (FATCA clients table)
CREATE TABLE IF NOT EXISTS fatca_clients (
  id SERIAL PRIMARY KEY,
  cli CHAR(15) NOT NULL UNIQUE,
  nom VARCHAR(100),
  date_entree_relation DATE,
  status_client VARCHAR(20),
  pays_naissance CHAR(3),
  nationalite CHAR(3),
  adresse TEXT,
  pays_adresse CHAR(3),
  telephone VARCHAR(30),
  relation_client CHAR(15),
  type_relation VARCHAR(20),
  fatca_status VARCHAR(20) DEFAULT 'À vérifier',
  fatca_date DATE,
  fatca_uti VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fatca_clients_cli ON fatca_clients(cli);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_status ON fatca_clients(fatca_status);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_pays_naissance ON fatca_clients(pays_naissance);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_nationalite ON fatca_clients(nationalite);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_pays_adresse ON fatca_clients(pays_adresse);

CREATE TRIGGER update_fatca_clients_updated_at BEFORE UPDATE ON fatca_clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table d'audit FATCA (FATCA audit log table)
CREATE TABLE IF NOT EXISTS fatca_audit_log (
  id SERIAL PRIMARY KEY,
  cli CHAR(15) NOT NULL,
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  performed_by VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fatca_audit_log_cli ON fatca_audit_log(cli);
CREATE INDEX IF NOT EXISTS idx_fatca_audit_log_created_at ON fatca_audit_log(created_at);

-- =====================================================
-- 4. ANOMALY TRACKING TABLES
-- =====================================================

-- Table des statistiques de correction par agence (Agency correction stats table)
CREATE TABLE IF NOT EXISTS agency_correction_stats (
  agency_code CHAR(5) PRIMARY KEY,
  agency_name VARCHAR(100),
  total_anomalies INTEGER DEFAULT 0,
  fixed_anomalies INTEGER DEFAULT 0,
  in_review_anomalies INTEGER DEFAULT 0,
  rejected_anomalies INTEGER DEFAULT 0,
  correction_rate DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agency_stats_code ON agency_correction_stats(agency_code);
CREATE INDEX IF NOT EXISTS idx_agency_stats_rate ON agency_correction_stats(correction_rate);

CREATE TRIGGER update_agency_stats_updated_at BEFORE UPDATE ON agency_correction_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table de l'historique des anomalies (Anomaly history table)
CREATE TABLE IF NOT EXISTS anomaly_history (
  id SERIAL PRIMARY KEY,
  cli CHAR(15) NOT NULL,
  field VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status anomaly_status DEFAULT 'detected',
  agency_code CHAR(5),
  user_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_anomaly_history_cli ON anomaly_history(cli);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_status ON anomaly_history(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_agency_code ON anomaly_history(agency_code);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_created_at ON anomaly_history(created_at);

CREATE TRIGGER update_anomaly_history_updated_at BEFORE UPDATE ON anomaly_history
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. DATA LOAD HISTORY
-- =====================================================

-- Table de l'historique des chargements de données (Data load history table)
CREATE TABLE IF NOT EXISTS data_load_history (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  records_count INTEGER DEFAULT 0,
  load_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  load_status load_status DEFAULT 'success',
  error_message TEXT,
  loaded_by VARCHAR(50),
  execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_data_load_table ON data_load_history(table_name);
CREATE INDEX IF NOT EXISTS idx_data_load_date ON data_load_history(load_date);
CREATE INDEX IF NOT EXISTS idx_data_load_status ON data_load_history(load_status);

-- =====================================================
-- 6. VIEWS FOR REPORTING
-- =====================================================

-- Vue pour les statistiques FATCA
CREATE OR REPLACE VIEW vw_fatca_statistics AS
SELECT
  COUNT(*) as total_clients,
  SUM(CASE WHEN fatca_status = 'À vérifier' THEN 1 ELSE 0 END) as to_verify,
  SUM(CASE WHEN fatca_status = 'Confirmé' THEN 1 ELSE 0 END) as confirmed,
  SUM(CASE WHEN fatca_status = 'Exclu' THEN 1 ELSE 0 END) as excluded,
  SUM(CASE WHEN fatca_status = 'En attente' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 ELSE 0 END) as current_month
FROM fatca_clients;

-- Vue pour les clients FATCA par type d'indice
CREATE OR REPLACE VIEW vw_fatca_clients_by_indicia AS
SELECT 'Lieu de naissance US' as indicia_type, COUNT(*) as client_count
FROM fatca_clients WHERE pays_naissance = 'US'
UNION ALL
SELECT 'Nationalité US' as indicia_type, COUNT(*) as client_count
FROM fatca_clients WHERE nationalite = 'US'
UNION ALL
SELECT 'Adresse US' as indicia_type, COUNT(*) as client_count
FROM fatca_clients WHERE pays_adresse = 'US'
UNION ALL
SELECT 'Téléphone US' as indicia_type, COUNT(*) as client_count
FROM fatca_clients WHERE telephone LIKE '+1%' OR telephone LIKE '001%';

-- =====================================================
-- Schema creation completed successfully
-- =====================================================
