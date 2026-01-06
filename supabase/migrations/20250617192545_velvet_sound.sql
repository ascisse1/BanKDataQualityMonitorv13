-- Create FATCA clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS fatca_clients (
  id SERIAL PRIMARY KEY,
  cli CHAR(15) NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cli)
);

-- Create FATCA audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS fatca_audit_log (
  id SERIAL PRIMARY KEY,
  cli CHAR(15) NOT NULL,
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  performed_by VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fatca_clients_cli ON fatca_clients(cli);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_status ON fatca_clients(fatca_status);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_pays_naissance ON fatca_clients(pays_naissance);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_nationalite ON fatca_clients(nationalite);
CREATE INDEX IF NOT EXISTS idx_fatca_clients_pays_adresse ON fatca_clients(pays_adresse);
CREATE INDEX IF NOT EXISTS idx_fatca_audit_log_cli ON fatca_audit_log(cli);

-- Create view for FATCA statistics
CREATE OR REPLACE VIEW vw_fatca_statistics AS
SELECT
  COUNT(*) as total_clients,
  SUM(CASE WHEN fatca_status = 'À vérifier' THEN 1 ELSE 0 END) as to_verify,
  SUM(CASE WHEN fatca_status = 'Confirmé' THEN 1 ELSE 0 END) as confirmed,
  SUM(CASE WHEN fatca_status = 'Exclu' THEN 1 ELSE 0 END) as excluded,
  SUM(CASE WHEN fatca_status = 'En attente' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END) as current_month
FROM fatca_clients;

-- Create view for FATCA clients by indicia type
CREATE OR REPLACE VIEW vw_fatca_clients_by_indicia AS
SELECT
  'Lieu de naissance US' as indicia_type,
  COUNT(*) as client_count
FROM fatca_clients
WHERE pays_naissance = 'US'
UNION ALL
SELECT
  'Nationalité US' as indicia_type,
  COUNT(*) as client_count
FROM fatca_clients
WHERE nationalite = 'US'
UNION ALL
SELECT
  'Adresse US' as indicia_type,
  COUNT(*) as client_count
FROM fatca_clients
WHERE pays_adresse = 'US'
UNION ALL
SELECT
  'Téléphone US' as indicia_type,
  COUNT(*) as client_count
FROM fatca_clients
WHERE telephone LIKE '+1%' OR telephone LIKE '001%' OR telephone LIKE '+01%' OR telephone LIKE '+001%';

-- Function to detect FATCA clients
CREATE OR REPLACE FUNCTION detect_fatca_clients()
RETURNS VOID AS $$
BEGIN
  INSERT INTO fatca_clients (cli, nom, date_entree_relation, status_client, pays_naissance, nationalite, pays_adresse, telephone, relation_client, type_relation)
  SELECT 
    c.cli,
    TRIM(COALESCE(c.nom, '')),
    c.dou,
    CASE 
      WHEN EXISTS (SELECT 1 FROM bkcom WHERE cha IN ('251100','251110','253110','253910') AND bkcom.cli=c.cli AND cfe='N') 
      THEN 'Client Actif'
      ELSE 'Ancien Client' 
    END,
    TRIM(COALESCE(c.payn, '')),
    TRIM(COALESCE(c.nat, '')),
    TRIM(COALESCE(a.cpay, '')),
    TRIM(COALESCE(t.num, '')),
    TRIM(COALESCE(c.clifam, '')),
    CASE
      WHEN c.clifam IS NOT NULL THEN 'Familiale'
      WHEN EXISTS (SELECT 1 FROM bkcoj WHERE bkcoj.cli = c.cli) THEN 'Joint'
      WHEN EXISTS (SELECT 1 FROM bkpscm WHERE bkpscm.cli = c.cli) THEN 'Mandataire'
      ELSE ''
    END
  FROM bkcli c
  LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
  LEFT JOIN bktelcli t ON c.cli = t.cli
  WHERE c.tcli = '1'
    AND c.dou BETWEEN '2024-01-01' AND CURRENT_DATE
    AND (
      c.payn = 'US'
      OR c.nat = 'US'
      OR a.cpay = 'US'
      OR t.num LIKE '+1%'
      OR t.num LIKE '001%'
      OR t.num LIKE '+01%'
      OR t.num LIKE '+001%'
    )
    AND NOT EXISTS (
      SELECT 1 FROM fatca_clients fc WHERE fc.cli = c.cli
    );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE fatca_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatca_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "All users can read FATCA clients"
  ON fatca_clients FOR SELECT
  USING (true);

CREATE POLICY "Only admins and auditors can modify FATCA clients"
  ON fatca_clients FOR ALL
  USING (auth.role() IN ('admin', 'auditor'))
  WITH CHECK (auth.role() IN ('admin', 'auditor'));

CREATE POLICY "All users can read FATCA audit logs"
  ON fatca_audit_log FOR SELECT
  USING (true);

CREATE POLICY "Only admins and auditors can create FATCA audit logs"
  ON fatca_audit_log FOR INSERT
  WITH CHECK (auth.role() IN ('admin', 'auditor'));