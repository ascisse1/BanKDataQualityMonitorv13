/*
  # Create views for statistics and reporting
  
  1. New Views
    - `vw_fatca_statistics` - FATCA statistics
    - `vw_fatca_clients_by_indicia` - FATCA clients by indicia type
*/

-- Create view for FATCA statistics
CREATE OR REPLACE VIEW vw_fatca_statistics AS
SELECT
  COUNT(*) AS total_clients,
  COUNT(CASE WHEN fatca_status = 'À vérifier' THEN 1 END) AS to_verify,
  COUNT(CASE WHEN fatca_status = 'Confirmé' THEN 1 END) AS confirmed,
  COUNT(CASE WHEN fatca_status = 'Exclu' THEN 1 END) AS excluded,
  COUNT(CASE WHEN fatca_status = 'En attente' THEN 1 END) AS pending,
  COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
             AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) AS current_month
FROM fatca_clients;

-- Create view for FATCA clients by indicia type
CREATE OR REPLACE VIEW vw_fatca_clients_by_indicia AS
SELECT 'Nationality' AS indicia_type, COUNT(*) AS client_count
FROM fatca_clients
WHERE nationalite = 'US'
UNION ALL
SELECT 'Birthplace' AS indicia_type, COUNT(*) AS client_count
FROM fatca_clients
WHERE pays_naissance = 'US'
UNION ALL
SELECT 'Address' AS indicia_type, COUNT(*) AS client_count
FROM fatca_clients
WHERE pays_adresse = 'US'
UNION ALL
SELECT 'Phone' AS indicia_type, COUNT(*) AS client_count
FROM fatca_clients
WHERE telephone LIKE '+1%' OR telephone LIKE '001%'
UNION ALL
SELECT 'Proxy' AS indicia_type, COUNT(*) AS client_count
FROM fatca_clients
WHERE type_relation = 'Mandataire';