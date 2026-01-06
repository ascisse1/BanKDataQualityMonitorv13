/*
  # Configuration de la base de données Bank Data Quality Monitor

  1. Nouvelles Tables
    - `bkcli` - Table des clients
    - `bkcom` - Table des comptes
    - `bkadcli` - Table des adresses clients
    - `bktelcli` - Table des téléphones clients
    - `bkemacli` - Table des emails clients
    - `fatca_clients` - Table des clients FATCA
    - `agency_correction_stats` - Table des statistiques de correction par agence
    - `anomaly_history` - Table de l'historique des anomalies
    - `users` - Table des utilisateurs

  2. Fonctions
    - `count_anomalies` - Compte le nombre total d'anomalies
    - `get_individual_validation_metrics` - Calcule les métriques de validation pour les clients particuliers
    - `get_corporate_validation_metrics` - Calcule les métriques de validation pour les clients entreprises
    - `get_institutional_validation_metrics` - Calcule les métriques de validation pour les clients institutionnels
    - `get_anomalies_by_branch` - Récupère les anomalies par agence
    - `get_fatca_stats` - Récupère les statistiques FATCA
    - `get_fatca_indicators` - Récupère les indicateurs FATCA

  3. Données d'exemple
    - Clients particuliers avec anomalies
    - Clients entreprises avec anomalies
    - Clients institutionnels avec anomalies
    - Utilisateurs par défaut
*/

-- Insérer des données d'exemple supplémentaires pour les clients particuliers
INSERT INTO bkcli (cli, nom, tcli, pre, nid, nmer, dna, nat, age, sext, viln, payn, tid)
VALUES
  ('CLI000011', 'SANGARE', '1', 'Moussa', 'ML24680', 'DIALLO Fatoumata', '1988-03-12', 'ML', '01201', 'M', 'Bamako', 'ML', 'CIN'),
  ('CLI000012', 'DIARRA', '1', 'Aïcha', 'ML13579', 'TRAORE Aminata', '1992-07-22', 'ML', '01202', 'F', 'Sikasso', 'ML', 'CIN'),
  ('CLI000013', 'DEMBELE', '1', 'Bakary', 'ML97531', 'COULIBALY Mariam', '1983-11-05', 'ML', '01203', 'M', 'Segou', 'ML', 'CIN'),
  ('CLI000014', 'CISSE', '1', 'Fanta', 'ML86420', 'KEITA Kadiatou', '1990-09-18', 'ML', '01204', 'F', 'Kayes', 'ML', 'CIN'),
  ('CLI000015', 'DOUMBIA', '1', 'Adama', 'ML75319', 'TOURE Fatoumata', '1975-04-30', 'ML', '01205', 'M', 'Mopti', 'ML', 'CIN'),
  ('CLI000016', 'WILLIAMS', '1', 'Michael', 'US24680', 'WILLIAMS Jane', '1980-05-15', 'US', '01201', 'M', 'Boston', 'US', 'PSP'),
  ('CLI000017', 'BROWN', '1', 'Emily', 'US13579', 'BROWN Susan', '1990-07-22', 'US', '01202', 'F', 'Los Angeles', 'US', 'PSP'),
  ('CLI000018', 'DAVIS', '1', 'Robert', 'US97531', 'DAVIS Mary', '1975-11-05', 'US', '01203', 'M', 'Chicago', 'US', 'PSP'),
  ('CLI000019', 'MILLER', '1', 'Jennifer', 'US86420', 'MILLER Patricia', '1985-09-18', 'US', '01204', 'F', 'Miami', 'US', 'PSP'),
  ('CLI000020', 'WILSON', '1', 'David', 'US75319', 'WILSON Elizabeth', '1970-04-30', 'US', '01205', 'M', 'Dallas', 'US', 'PSP')
ON CONFLICT (cli) DO NOTHING;

-- Insérer des données d'exemple supplémentaires pour les clients entreprises
INSERT INTO bkcli (cli, nom, tcli, rso, nrc, datc, age, sig, sec, fju, catn, lienbq)
VALUES
  ('ENT000009', 'SOCIETE H', '2', 'SOCIETE ANONYME H', 'MA97531', '2015-04-05', '01201', 'SH', 'Énergie', 'SA', 'GE', 'Client'),
  ('ENT000010', 'SOCIETE I', '2', 'SOCIETE ANONYME I', 'MA86420', '2010-09-18', '01202', 'SI', 'Télécommunications', 'SARL', 'PME', 'Client'),
  ('ENT000011', 'SOCIETE J', '2', 'SOCIETE ANONYME J', 'MA75319', '2005-04-30', '01203', 'SJ', 'Agroalimentaire', 'SA', 'GE', 'Client'),
  ('ENT000012', 'SOCIETE K', '2', 'SOCIETE ANONYME K', 'MA64208', '2018-03-12', '01204', 'SK', 'Santé', 'SARL', 'PME', 'Client'),
  ('ENT000013', 'SOCIETE L', '2', 'SOCIETE ANONYME L', 'MA53197', '2012-07-22', '01205', 'SL', 'Éducation', 'SA', 'PME', 'Client'),
  ('ENT000014', 'US CORP A', '2', 'US CORPORATION A', 'US64208', '2010-03-12', '01201', 'USCA', 'Finance', 'INC', 'GE', 'Client'),
  ('ENT000015', 'US CORP B', '2', 'US CORPORATION B', 'US53197', '2015-07-22', '01202', 'USCB', 'Technologie', 'INC', 'GE', 'Client')
ON CONFLICT (cli) DO NOTHING;

-- Insérer des données d'exemple supplémentaires pour les clients institutionnels
INSERT INTO bkcli (cli, nom, tcli, rso, nrc, datc, age, sec, fju, catn, lienbq)
VALUES
  ('INS000006', 'INSTITUTION F', '3', 'INSTITUTION PUBLIQUE F', 'ML64208', '2005-03-12', '01201', 'Défense', 'EP', 'GE', 'Client'),
  ('INS000007', 'INSTITUTION G', '3', 'INSTITUTION PUBLIQUE G', 'ML53197', '2010-07-22', '01202', 'Recherche', 'EP', 'GE', 'Client'),
  ('INS000008', 'INSTITUTION H', '3', 'INSTITUTION PUBLIQUE H', 'ML42086', '2000-11-05', '01203', 'Culture', 'EP', 'GE', 'Client'),
  ('INS000009', 'INSTITUTION I', '3', 'INSTITUTION PUBLIQUE I', 'ML31975', '2015-09-18', '01204', 'Sport', 'EP', 'GE', 'Client'),
  ('INS000010', 'INSTITUTION J', '3', 'INSTITUTION PUBLIQUE J', 'ML20864', '2008-04-30', '01205', 'Environnement', 'EP', 'GE', 'Client')
ON CONFLICT (cli) DO NOTHING;

-- Insérer des adresses clients supplémentaires
INSERT INTO bkadcli (cli, typ, adr1, adr2, ville, cpay)
VALUES
  ('CLI000011', 'F', 'Rue 223, Porte 12', 'Quartier Hippodrome', 'Bamako', 'ML'),
  ('CLI000012', 'F', 'Avenue de la Paix', 'Quartier Résidentiel', 'Sikasso', 'ML'),
  ('CLI000013', 'F', 'Rue du Commerce', 'Centre-Ville', 'Segou', 'ML'),
  ('CLI000014', 'F', 'Boulevard de la Nation', 'Quartier Administratif', 'Kayes', 'ML'),
  ('CLI000015', 'F', 'Avenue des Fleurs', 'Quartier Moderne', 'Mopti', 'ML'),
  ('CLI000016', 'F', '789 Washington Street', 'Downtown', 'Boston', 'US'),
  ('CLI000017', 'F', '456 Hollywood Blvd', 'Beverly Hills', 'Los Angeles', 'US'),
  ('CLI000018', 'F', '123 Michigan Avenue', 'Downtown', 'Chicago', 'US'),
  ('CLI000019', 'F', '789 Ocean Drive', 'South Beach', 'Miami', 'US'),
  ('CLI000020', 'F', '456 Main Street', 'Downtown', 'Dallas', 'US'),
  ('ENT000009', 'F', 'Zone Industrielle', 'Sotuba', 'Bamako', 'ML'),
  ('ENT000010', 'F', 'Quartier du Commerce', 'Centre-Ville', 'Sikasso', 'ML'),
  ('ENT000014', 'F', '123 Wall Street', 'Financial District', 'New York', 'US'),
  ('ENT000015', 'F', '456 Silicon Valley Blvd', 'Tech Park', 'San Francisco', 'US'),
  ('INS000006', 'F', 'Quartier Administratif', 'Centre-Ville', 'Bamako', 'ML'),
  ('INS000007', 'F', 'Campus Universitaire', 'Badalabougou', 'Bamako', 'ML')
ON CONFLICT (cli, typ) DO NOTHING;

-- Insérer des numéros de téléphone supplémentaires
INSERT INTO bktelcli (cli, typ, num)
VALUES
  ('CLI000011', 'GSM', '+22375123456'),
  ('CLI000012', 'GSM', '+22376234567'),
  ('CLI000013', 'GSM', '+22377345678'),
  ('CLI000014', 'GSM', '+22378456789'),
  ('CLI000015', 'GSM', '+22379567890'),
  ('CLI000016', 'GSM', '+16175551234'),
  ('CLI000017', 'GSM', '+13235559876'),
  ('CLI000018', 'GSM', '+13125551234'),
  ('CLI000019', 'GSM', '+13055559876'),
  ('CLI000020', 'GSM', '+12145551234'),
  ('ENT000009', 'FIX', '+22320234567'),
  ('ENT000010', 'FIX', '+22320345678'),
  ('ENT000014', 'FIX', '+12125551234'),
  ('ENT000015', 'FIX', '+14155559876'),
  ('INS000006', 'FIX', '+22320456789'),
  ('INS000007', 'FIX', '+22320567890')
ON CONFLICT (cli, typ) DO NOTHING;

-- Insérer des emails clients supplémentaires
INSERT INTO bkemacli (cli, email)
VALUES
  ('CLI000011', 'moussa.sangare@example.com'),
  ('CLI000012', 'aicha.diarra@example.com'),
  ('CLI000013', 'bakary.dembele@example.com'),
  ('CLI000014', 'fanta.cisse@example.com'),
  ('CLI000015', 'adama.doumbia@example.com'),
  ('CLI000016', 'michael.williams@example.com'),
  ('CLI000017', 'emily.brown@example.com'),
  ('CLI000018', 'robert.davis@example.com'),
  ('CLI000019', 'jennifer.miller@example.com'),
  ('CLI000020', 'david.wilson@example.com'),
  ('ENT000009', 'contact@societeh.ml'),
  ('ENT000010', 'info@societei.ml'),
  ('ENT000014', 'info@uscorpa.com'),
  ('ENT000015', 'contact@uscorpb.com'),
  ('INS000006', 'contact@institutionf.ml'),
  ('INS000007', 'info@institutiong.ml')
ON CONFLICT (cli, email) DO NOTHING;

-- Insérer des utilisateurs d'agence
INSERT INTO users (username, email, password_hash, full_name, role, department, agency_code, status)
VALUES 
  ('agency_01201', 'agence.01201@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Utilisateur Agence Principale 1', 'agency_user', 'Agence', '01201', 'active'),
  ('agency_01202', 'agence.01202@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Utilisateur Agence Boubacar Sidibe', 'agency_user', 'Agence', '01202', 'active'),
  ('agency_01203', 'agence.01203@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Utilisateur Agence Sogoniko', 'agency_user', 'Agence', '01203', 'active'),
  ('agency_01204', 'agence.01204@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Utilisateur Centre Technique Western Union', 'agency_user', 'Agence', '01204', 'active'),
  ('agency_01205', 'agence.01205@bdm-sa.com', '$2a$10$X7VYVy9LV9aE9.L0ZxJlI.t9dKJ3xwkNOHYJBAD5C/ZR.gYOuZS9e', 'Utilisateur Agence Korofina', 'agency_user', 'Agence', '01205', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insérer des données FATCA
INSERT INTO fatca_clients (cli, nom, date_entree_relation, status_client, pays_naissance, nationalite, adresse, pays_adresse, telephone, relation_client, type_relation, fatca_status, fatca_date, fatca_uti, notes)
VALUES
  ('CLI000009', 'SMITH John', '2020-01-01', 'Client Actif', 'US', 'US', '123 Broadway Street, Manhattan, New York', 'US', '+12125551234', NULL, NULL, 'À vérifier', NULL, NULL, 'Client avec nationalité américaine'),
  ('CLI000010', 'JOHNSON Sarah', '2021-06-15', 'Client Actif', 'US', 'US', '456 Michigan Avenue, Downtown, Chicago', 'US', '+13125559876', NULL, NULL, 'À vérifier', NULL, NULL, 'Client avec nationalité américaine'),
  ('CLI000016', 'WILLIAMS Michael', '2019-05-15', 'Client Actif', 'US', 'US', '789 Washington Street, Downtown, Boston', 'US', '+16175551234', NULL, NULL, 'Confirmé', '2023-03-10', 'admin', 'Documentation W-9 reçue'),
  ('CLI000017', 'BROWN Emily', '2022-07-22', 'Client Actif', 'US', 'US', '456 Hollywood Blvd, Beverly Hills, Los Angeles', 'US', '+13235559876', NULL, NULL, 'Confirmé', '2023-05-20', 'admin', 'Documentation W-9 reçue'),
  ('CLI000018', 'DAVIS Robert', '2018-11-05', 'Client Actif', 'US', 'US', '123 Michigan Avenue, Downtown, Chicago', 'US', '+13125551234', NULL, NULL, 'Exclu', '2023-02-15', 'admin', 'Client non soumis à FATCA après vérification'),
  ('CLI000019', 'MILLER Jennifer', '2020-09-18', 'Client Actif', 'US', 'US', '789 Ocean Drive, South Beach, Miami', 'US', '+13055559876', NULL, NULL, 'À vérifier', NULL, NULL, 'Client avec nationalité américaine'),
  ('CLI000020', 'WILSON David', '2017-04-30', 'Client Actif', 'US', 'US', '456 Main Street, Downtown, Dallas', 'US', '+12145551234', NULL, NULL, 'À vérifier', NULL, NULL, 'Client avec nationalité américaine'),
  ('ENT000008', 'US COMPANY', '2000-04-05', 'Client Actif', NULL, NULL, '789 Wall Street, Financial District, New York', 'US', '+12125557890', NULL, NULL, 'À vérifier', NULL, NULL, 'Entreprise avec adresse aux États-Unis'),
  ('ENT000014', 'US CORP A', '2010-03-12', 'Client Actif', NULL, NULL, '123 Wall Street, Financial District, New York', 'US', '+12125551234', NULL, NULL, 'Confirmé', '2023-04-15', 'admin', 'Documentation W-8BEN-E reçue'),
  ('ENT000015', 'US CORP B', '2015-07-22', 'Client Actif', NULL, NULL, '456 Silicon Valley Blvd, Tech Park, San Francisco', 'US', '+14155559876', NULL, NULL, 'À vérifier', NULL, NULL, 'Entreprise avec adresse aux États-Unis')
ON CONFLICT (cli) DO NOTHING;

-- Insérer des historiques d'anomalies supplémentaires
INSERT INTO anomaly_history (cli, field, old_value, new_value, status, agency_code, user_id, created_at)
VALUES
  ('CLI000009', 'nid', '', 'US123456', 'fixed', '01204', 1, CURRENT_TIMESTAMP - INTERVAL '29 days'),
  ('CLI000010', 'nmer', '', 'WILLIAMS Emma', 'fixed', '01205', 1, CURRENT_TIMESTAMP - INTERVAL '28 days'),
  ('CLI000016', 'dna', '', '1980-05-15', 'fixed', '01201', 1, CURRENT_TIMESTAMP - INTERVAL '27 days'),
  ('CLI000017', 'nat', '', 'US', 'fixed', '01202', 1, CURRENT_TIMESTAMP - INTERVAL '26 days'),
  ('CLI000018', 'sext', '', 'M', 'fixed', '01203', 1, CURRENT_TIMESTAMP - INTERVAL '25 days'),
  ('CLI000019', 'viln', '', 'Miami', 'in_review', '01204', 1, CURRENT_TIMESTAMP - INTERVAL '24 days'),
  ('CLI000020', 'payn', '', 'US', 'in_review', '01205', 1, CURRENT_TIMESTAMP - INTERVAL '23 days'),
  ('ENT000008', 'nrc', '', 'US97531', 'fixed', '01203', 1, CURRENT_TIMESTAMP - INTERVAL '22 days'),
  ('ENT000014', 'rso', '', 'US CORPORATION A', 'fixed', '01201', 1, CURRENT_TIMESTAMP - INTERVAL '21 days'),
  ('ENT000015', 'datc', '', '2015-07-22', 'fixed', '01202', 1, CURRENT_TIMESTAMP - INTERVAL '20 days');

-- Mettre à jour les statistiques de correction par agence
UPDATE agency_correction_stats
SET 
  total_anomalies = total_anomalies + 10,
  fixed_anomalies = fixed_anomalies + 7,
  in_review_anomalies = in_review_anomalies + 3,
  last_updated = CURRENT_TIMESTAMP
WHERE agency_code IN ('01201', '01202', '01203', '01204', '01205');

-- Insérer des historiques de chargement de données supplémentaires
INSERT INTO data_load_history (table_name, records_count, load_date, load_status, error_message, loaded_by, execution_time_ms)
VALUES
  ('bkcli', 32, CURRENT_TIMESTAMP - INTERVAL '29 days', 'success', NULL, 'admin', 1800),
  ('bkcom', 64, CURRENT_TIMESTAMP - INTERVAL '28 days', 'success', NULL, 'admin', 2500),
  ('bkadcli', 16, CURRENT_TIMESTAMP - INTERVAL '27 days', 'success', NULL, 'admin', 1200),
  ('bktelcli', 16, CURRENT_TIMESTAMP - INTERVAL '26 days', 'success', NULL, 'admin', 1000),
  ('bkemacli', 16, CURRENT_TIMESTAMP - INTERVAL '25 days', 'success', NULL, 'admin', 900);