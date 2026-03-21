-- =====================================================
-- MySQL Schema for Bank Data Quality Monitor
-- Converted from Supabase PostgreSQL migrations
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_audit_log;
DROP TABLE IF EXISTS data_load_history;
DROP TABLE IF EXISTS anomaly_history;
DROP TABLE IF EXISTS agency_correction_stats;
DROP TABLE IF EXISTS fatca_audit_log;
DROP TABLE IF EXISTS fatca_clients;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS bkpscm;
DROP TABLE IF EXISTS bkcoj;
DROP TABLE IF EXISTS bkemacli;
DROP TABLE IF EXISTS bktelcli;
DROP TABLE IF EXISTS bkadcli;
DROP TABLE IF EXISTS bkcom;
DROP TABLE IF EXISTS bkcli;

-- =====================================================
-- 1. MAIN BANKING TABLES
-- =====================================================

-- Table des clients (Main client table)
CREATE TABLE bkcli (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bkcli_tcli (tcli),
  INDEX idx_bkcli_age (age),
  INDEX idx_bkcli_nat (nat),
  INDEX idx_bkcli_payn (payn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des comptes (Accounts table)
CREATE TABLE bkcom (
  cli CHAR(15) NOT NULL,
  cha CHAR(6) NOT NULL,
  dev CHAR(3) NOT NULL,
  age CHAR(5) NOT NULL,
  ncp CHAR(11) NOT NULL,
  cfe CHAR(1),
  PRIMARY KEY (cli, cha, dev, age, ncp),
  INDEX idx_bkcom_cli (cli),
  INDEX idx_bkcom_cha (cha),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des adresses clients (Client addresses table)
CREATE TABLE bkadcli (
  cli CHAR(15) NOT NULL,
  typ CHAR(2) NOT NULL,
  adr1 VARCHAR(100),
  adr2 VARCHAR(100),
  adr3 VARCHAR(100),
  ville VARCHAR(50),
  cpay CHAR(3),
  PRIMARY KEY (cli, typ),
  INDEX idx_bkadcli_cli (cli),
  INDEX idx_bkadcli_cpay (cpay),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des téléphones clients (Client phones table)
CREATE TABLE bktelcli (
  cli CHAR(15) NOT NULL,
  typ CHAR(3) NOT NULL,
  num VARCHAR(30),
  PRIMARY KEY (cli, typ),
  INDEX idx_bktelcli_cli (cli),
  INDEX idx_bktelcli_num (num),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des emails clients (Client emails table)
CREATE TABLE bkemacli (
  cli CHAR(15) NOT NULL,
  email VARCHAR(100) NOT NULL,
  PRIMARY KEY (cli, email),
  INDEX idx_bkemacli_cli (cli),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des co-titulaires (Joint account holders table)
CREATE TABLE bkcoj (
  clip CHAR(15) NOT NULL,
  ord INT NOT NULL,
  cli CHAR(15),
  nom VARCHAR(100),
  pre VARCHAR(100),
  PRIMARY KEY (clip, ord),
  INDEX idx_bkcoj_clip (clip),
  INDEX idx_bkcoj_cli (cli),
  FOREIGN KEY (clip) REFERENCES bkcli(cli) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des mandataires (Proxy holders table)
CREATE TABLE bkpscm (
  cli CHAR(15) NOT NULL,
  ord INT NOT NULL,
  clim CHAR(15),
  nom VARCHAR(100),
  pre VARCHAR(100),
  PRIMARY KEY (cli, ord),
  INDEX idx_bkpscm_cli (cli),
  INDEX idx_bkpscm_clim (clim),
  FOREIGN KEY (cli) REFERENCES bkcli(cli) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. USERS AND AUTHENTICATION
-- =====================================================

-- Table des utilisateurs (Users table)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role ENUM('admin', 'auditor', 'user', 'agency_user') NOT NULL DEFAULT 'user',
  department VARCHAR(50),
  agency_code CHAR(5),
  status ENUM('active', 'inactive', 'locked') NOT NULL DEFAULT 'active',
  last_login TIMESTAMP NULL,
  failed_login_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_username (username),
  INDEX idx_users_email (email),
  INDEX idx_users_agency_code (agency_code),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table d'audit des utilisateurs (User audit log table)
CREATE TABLE user_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_audit_user_id (user_id),
  INDEX idx_user_audit_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. FATCA TABLES
-- =====================================================

-- Table des clients FATCA (FATCA clients table)
CREATE TABLE fatca_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fatca_clients_cli (cli),
  INDEX idx_fatca_clients_status (fatca_status),
  INDEX idx_fatca_clients_pays_naissance (pays_naissance),
  INDEX idx_fatca_clients_nationalite (nationalite),
  INDEX idx_fatca_clients_pays_adresse (pays_adresse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table d'audit FATCA (FATCA audit log table)
CREATE TABLE fatca_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cli CHAR(15) NOT NULL,
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  performed_by VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fatca_audit_log_cli (cli),
  INDEX idx_fatca_audit_log_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ANOMALY TRACKING TABLES
-- =====================================================

-- Table des statistiques de correction par agence (Agency correction stats table)
CREATE TABLE agency_correction_stats (
  agency_code CHAR(5) PRIMARY KEY,
  agency_name VARCHAR(100),
  total_anomalies INT DEFAULT 0,
  fixed_anomalies INT DEFAULT 0,
  in_review_anomalies INT DEFAULT 0,
  rejected_anomalies INT DEFAULT 0,
  correction_rate DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agency_stats_code (agency_code),
  INDEX idx_agency_stats_rate (correction_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de l'historique des anomalies (Anomaly history table)
CREATE TABLE anomaly_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cli CHAR(15) NOT NULL,
  field VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status ENUM('detected', 'in_review', 'fixed', 'rejected') DEFAULT 'detected',
  agency_code CHAR(5),
  user_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_anomaly_history_cli (cli),
  INDEX idx_anomaly_history_status (status),
  INDEX idx_anomaly_history_agency_code (agency_code),
  INDEX idx_anomaly_history_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. DATA LOAD HISTORY
-- =====================================================

-- Table de l'historique des chargements de données (Data load history table)
CREATE TABLE data_load_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  records_count INT DEFAULT 0,
  load_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  load_status ENUM('success', 'warning', 'error') DEFAULT 'success',
  error_message TEXT,
  loaded_by VARCHAR(50),
  execution_time_ms INT,
  INDEX idx_data_load_table (table_name),
  INDEX idx_data_load_date (load_date),
  INDEX idx_data_load_status (load_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. VIEWS FOR REPORTING
-- =====================================================

-- Vue pour les statistiques FATCA
DROP VIEW IF EXISTS vw_fatca_statistics;
CREATE VIEW vw_fatca_statistics AS
SELECT
  COUNT(*) as total_clients,
  SUM(CASE WHEN fatca_status = 'À vérifier' THEN 1 ELSE 0 END) as to_verify,
  SUM(CASE WHEN fatca_status = 'Confirmé' THEN 1 ELSE 0 END) as confirmed,
  SUM(CASE WHEN fatca_status = 'Exclu' THEN 1 ELSE 0 END) as excluded,
  SUM(CASE WHEN fatca_status = 'En attente' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN created_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 ELSE 0 END) as current_month
FROM fatca_clients;

-- Vue pour les clients FATCA par type d'indice
DROP VIEW IF EXISTS vw_fatca_clients_by_indicia;
CREATE VIEW vw_fatca_clients_by_indicia AS
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
