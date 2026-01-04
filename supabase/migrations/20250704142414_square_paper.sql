/*
  # Création des tables bancaires pour le moniteur de qualité des données

  1. Tables Principales
    - `bkcli` - Table des clients
    - `bkcom` - Table des comptes
    - `bkadcli` - Table des adresses clients
    - `bktelcli` - Table des téléphones clients
    - `bkemacli` - Table des emails clients
    - `bkcoj` - Table des co-titulaires
    - `bkpscm` - Table des mandataires

  2. Tables de Suivi
    - `agency_correction_stats` - Statistiques de correction par agence
    - `anomaly_history` - Historique des anomalies
    - `data_load_history` - Historique des chargements de données
    - `users` - Utilisateurs du système
    - `user_audit_log` - Journal d'audit des utilisateurs

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Ajout des politiques d'accès
*/

-- Table des clients
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des comptes
CREATE TABLE IF NOT EXISTS bkcom (
  cli CHAR(15) NOT NULL,
  cha CHAR(6) NOT NULL,
  dev CHAR(3) NOT NULL,
  age CHAR(5) NOT NULL,
  ncp CHAR(11) NOT NULL,
  cfe CHAR(1),
  PRIMARY KEY (cli, cha, dev, age, ncp)
);

-- Table des adresses clients
CREATE TABLE IF NOT EXISTS bkadcli (
  cli CHAR(15) NOT NULL,
  typ CHAR(2) NOT NULL,
  adr1 VARCHAR(100),
  adr2 VARCHAR(100),
  adr3 VARCHAR(100),
  ville VARCHAR(50),
  cpay CHAR(3),
  PRIMARY KEY (cli, typ)
);

-- Table des téléphones clients
CREATE TABLE IF NOT EXISTS bktelcli (
  cli CHAR(15) NOT NULL,
  typ CHAR(3) NOT NULL,
  num VARCHAR(30),
  PRIMARY KEY (cli, typ)
);

-- Table des emails clients
CREATE TABLE IF NOT EXISTS bkemacli (
  cli CHAR(15) NOT NULL,
  email VARCHAR(100) NOT NULL,
  PRIMARY KEY (cli, email)
);

-- Table des co-titulaires
CREATE TABLE IF NOT EXISTS bkcoj (
  clip CHAR(15) NOT NULL,
  ord INTEGER NOT NULL,
  cli CHAR(15),
  nom VARCHAR(100),
  pre VARCHAR(100),
  PRIMARY KEY (clip, ord)
);

-- Table des mandataires
CREATE TABLE IF NOT EXISTS bkpscm (
  age CHAR(5) NOT NULL,
  num CHAR(6) NOT NULL,
  nord INTEGER NOT NULL,
  cli CHAR(15),
  ctie CHAR(15),
  qua CHAR(2),
  PRIMARY KEY (age, num, nord)
);

-- Table des statistiques de correction par agence
CREATE TABLE IF NOT EXISTS agency_correction_stats (
  id SERIAL PRIMARY KEY,
  agency_code CHAR(5) NOT NULL,
  agency_name VARCHAR(100),
  total_anomalies INTEGER DEFAULT 0,
  fixed_anomalies INTEGER DEFAULT 0,
  in_review_anomalies INTEGER DEFAULT 0,
  rejected_anomalies INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agency_code)
);

-- Table de l'historique des anomalies
CREATE TABLE IF NOT EXISTS anomaly_history (
  id SERIAL PRIMARY KEY,
  cli CHAR(15) NOT NULL,
  field VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status VARCHAR(20) NOT NULL,
  agency_code CHAR(5),
  user_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'historique des chargements de données
CREATE TABLE IF NOT EXISTS data_load_history (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  records_count INTEGER DEFAULT 0,
  load_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  load_status VARCHAR(20) NOT NULL,
  error_message TEXT,
  loaded_by VARCHAR(50),
  execution_time_ms INTEGER
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  department VARCHAR(50),
  agency_code CHAR(5),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER
);

-- Table du journal d'audit des utilisateurs
CREATE TABLE IF NOT EXISTS user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activer Row Level Security
ALTER TABLE bkcli ENABLE ROW LEVEL SECURITY;
ALTER TABLE bkcom ENABLE ROW LEVEL SECURITY;
ALTER TABLE bkadcli ENABLE ROW LEVEL SECURITY;
ALTER TABLE bktelcli ENABLE ROW LEVEL SECURITY;
ALTER TABLE bkemacli ENABLE ROW LEVEL SECURITY;
ALTER TABLE bkcoj ENABLE ROW LEVEL SECURITY;
ALTER TABLE bkpscm ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_correction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_load_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS
CREATE POLICY "Tous les utilisateurs peuvent lire les clients"
  ON bkcli FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les comptes"
  ON bkcom FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les adresses"
  ON bkadcli FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les téléphones"
  ON bktelcli FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les emails"
  ON bkemacli FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les co-titulaires"
  ON bkcoj FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les mandataires"
  ON bkpscm FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les statistiques de correction"
  ON agency_correction_stats FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire l'historique des anomalies"
  ON anomaly_history FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire l'historique des chargements"
  ON data_load_history FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire les utilisateurs"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Tous les utilisateurs peuvent lire le journal d'audit"
  ON user_audit_log FOR SELECT
  USING (true);

-- Créer des utilisateurs par défaut
INSERT INTO users (username, email, password_hash, full_name, role, department, status)
VALUES 
  ('admin', 'admin@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Administrateur Système', 'admin', 'IT', 'active'),
  ('auditor', 'audit@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Auditeur Principal', 'auditor', 'Audit', 'active'),
  ('user', 'user@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Utilisateur Standard', 'user', 'Opérations', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insérer des données d'exemple pour les agences
INSERT INTO agency_correction_stats (agency_code, agency_name, total_anomalies, fixed_anomalies, in_review_anomalies, rejected_anomalies)
VALUES
  ('01201', 'AGENCE PRINCIPALE 1', 4801, 3842, 523, 120),
  ('01202', 'AGENCE BOUBACAR SIDIBE', 363, 290, 45, 10),
  ('01203', 'AGENCE SOGONIKO', 4843, 3630, 605, 150),
  ('01204', 'CENTRE TECHNIQUE WESTERN UNION', 4471, 3130, 670, 200),
  ('01205', 'AGENCE KOROFINA', 3194, 2235, 479, 160)
ON CONFLICT (agency_code) DO NOTHING;