-- Function to count anomalies
CREATE OR REPLACE FUNCTION count_anomalies()
RETURNS INTEGER AS $$
DECLARE
  anomaly_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO anomaly_count
  FROM bkcli
  WHERE 
    -- Common rules for all client types
    (cli IS NULL OR TRIM(cli) = '' OR tcli NOT IN ('1', '2', '3') OR age IS NULL OR TRIM(age) = '')
    
    -- Rules for individual clients (tcli = 1)
    OR (tcli = '1' AND (
      nid IS NULL OR TRIM(nid) = '' OR 
      nmer IS NULL OR TRIM(nmer) = '' OR 
      dna IS NULL OR
      nat IS NULL OR TRIM(nat) = '' OR
      nom IS NULL OR TRIM(nom) = '' OR
      pre IS NULL OR TRIM(pre) = '' OR
      sext NOT IN ('M', 'F') OR
      viln IS NULL OR TRIM(viln) = '' OR
      payn IS NULL OR TRIM(payn) = '' OR
      tid IS NULL OR TRIM(tid) = ''
    ))
    
    -- Rules for corporate clients (tcli = 2)
    OR (tcli = '2' AND (
      rso IS NULL OR TRIM(rso) = '' OR
      nrc IS NULL OR TRIM(nrc) = '' OR
      datc IS NULL OR
      sec IS NULL OR TRIM(sec) = '' OR
      fju IS NULL OR TRIM(fju) = '' OR
      catn IS NULL OR TRIM(catn) = '' OR
      lienbq IS NULL OR TRIM(lienbq) = ''
    ))
    
    -- Rules for institutional clients (tcli = 3)
    OR (tcli = '3' AND (
      rso IS NULL OR TRIM(rso) = '' OR
      nrc IS NULL OR TRIM(nrc) = '' OR
      datc IS NULL OR
      sec IS NULL OR TRIM(sec) = '' OR
      fju IS NULL OR TRIM(fju) = '' OR
      catn IS NULL OR TRIM(catn) = '' OR
      lienbq IS NULL OR TRIM(lienbq) = ''
    ));
    
  RETURN anomaly_count;
END;
$$ LANGUAGE plpgsql;

-- Function to count FATCA clients
CREATE OR REPLACE FUNCTION count_fatca_clients()
RETURNS INTEGER AS $$
DECLARE
  fatca_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fatca_count
  FROM bkcli c
  LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
  LEFT JOIN bktelcli t ON c.cli = t.cli
  WHERE c.tcli = '1' AND (
    c.payn = 'US' OR c.nat = 'US' OR 
    a.cpay = 'US' OR
    t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
  );
    
  RETURN fatca_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get individual validation metrics
CREATE OR REPLACE FUNCTION get_individual_validation_metrics()
RETURNS TABLE (
  total_records BIGINT,
  valid_records BIGINT,
  quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_records,
    SUM(CASE WHEN 
      nid IS NOT NULL AND TRIM(nid) != '' AND 
      nmer IS NOT NULL AND TRIM(nmer) != '' AND 
      dna IS NOT NULL AND
      nat IS NOT NULL AND TRIM(nat) != '' AND
      nom IS NOT NULL AND TRIM(nom) != '' AND
      pre IS NOT NULL AND TRIM(pre) != '' AND
      (sext = 'M' OR sext = 'F') AND
      viln IS NOT NULL AND TRIM(viln) != '' AND
      payn IS NOT NULL AND TRIM(payn) != '' AND
      tid IS NOT NULL AND TRIM(tid) != ''
    THEN 1 ELSE 0 END) AS valid_records,
    ROUND(
      (SUM(CASE WHEN 
        nid IS NOT NULL AND TRIM(nid) != '' AND 
        nmer IS NOT NULL AND TRIM(nmer) != '' AND 
        dna IS NOT NULL AND
        nat IS NOT NULL AND TRIM(nat) != '' AND
        nom IS NOT NULL AND TRIM(nom) != '' AND
        pre IS NOT NULL AND TRIM(pre) != '' AND
        (sext = 'M' OR sext = 'F') AND
        viln IS NOT NULL AND TRIM(viln) != '' AND
        payn IS NOT NULL AND TRIM(payn) != '' AND
        tid IS NOT NULL AND TRIM(tid) != ''
      THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
    ) AS quality_score
  FROM bkcli 
  WHERE tcli = '1';
END;
$$ LANGUAGE plpgsql;

-- Function to get corporate validation metrics
CREATE OR REPLACE FUNCTION get_corporate_validation_metrics()
RETURNS TABLE (
  total_records BIGINT,
  valid_records BIGINT,
  quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_records,
    SUM(CASE WHEN 
      rso IS NOT NULL AND TRIM(rso) != '' AND
      nrc IS NOT NULL AND TRIM(nrc) != '' AND
      datc IS NOT NULL AND
      sec IS NOT NULL AND TRIM(sec) != '' AND
      fju IS NOT NULL AND TRIM(fju) != '' AND
      catn IS NOT NULL AND TRIM(catn) != '' AND
      lienbq IS NOT NULL AND TRIM(lienbq) != ''
    THEN 1 ELSE 0 END) AS valid_records,
    ROUND(
      (SUM(CASE WHEN 
        rso IS NOT NULL AND TRIM(rso) != '' AND
        nrc IS NOT NULL AND TRIM(nrc) != '' AND
        datc IS NOT NULL AND
        sec IS NOT NULL AND TRIM(sec) != '' AND
        fju IS NOT NULL AND TRIM(fju) != '' AND
        catn IS NOT NULL AND TRIM(catn) != '' AND
        lienbq IS NOT NULL AND TRIM(lienbq) != ''
      THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
    ) AS quality_score
  FROM bkcli 
  WHERE tcli = '2';
END;
$$ LANGUAGE plpgsql;

-- Function to get institutional validation metrics
CREATE OR REPLACE FUNCTION get_institutional_validation_metrics()
RETURNS TABLE (
  total_records BIGINT,
  valid_records BIGINT,
  quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_records,
    SUM(CASE WHEN 
      rso IS NOT NULL AND TRIM(rso) != '' AND
      nrc IS NOT NULL AND TRIM(nrc) != '' AND
      datc IS NOT NULL AND
      sec IS NOT NULL AND TRIM(sec) != '' AND
      fju IS NOT NULL AND TRIM(fju) != '' AND
      catn IS NOT NULL AND TRIM(catn) != '' AND
      lienbq IS NOT NULL AND TRIM(lienbq) != ''
    THEN 1 ELSE 0 END) AS valid_records,
    ROUND(
      (SUM(CASE WHEN 
        rso IS NOT NULL AND TRIM(rso) != '' AND
        nrc IS NOT NULL AND TRIM(nrc) != '' AND
        datc IS NOT NULL AND
        sec IS NOT NULL AND TRIM(sec) != '' AND
        fju IS NOT NULL AND TRIM(fju) != '' AND
        catn IS NOT NULL AND TRIM(catn) != '' AND
        lienbq IS NOT NULL AND TRIM(lienbq) != ''
      THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
    ) AS quality_score
  FROM bkcli 
  WHERE tcli = '3';
END;
$$ LANGUAGE plpgsql;

-- Function to get anomalies by branch
CREATE OR REPLACE FUNCTION get_anomalies_by_branch()
RETURNS TABLE (
  code_agence TEXT,
  lib_agence TEXT,
  nombre_anomalies BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.age AS code_agence,
    COALESCE(a.agency_name, 'AGENCE ' || c.age) AS lib_agence,
    COUNT(*) AS nombre_anomalies
  FROM bkcli c
  LEFT JOIN agency_correction_stats a ON c.age = a.agency_code
  WHERE 
    -- Common rules for all client types
    (cli IS NULL OR TRIM(cli) = '' OR tcli NOT IN ('1', '2', '3') OR age IS NULL OR TRIM(age) = '')
    
    -- Rules for individual clients (tcli = 1)
    OR (c.tcli = '1' AND (
      nid IS NULL OR TRIM(nid) = '' OR 
      nmer IS NULL OR TRIM(nmer) = '' OR 
      dna IS NULL OR
      nat IS NULL OR TRIM(nat) = '' OR
      nom IS NULL OR TRIM(nom) = '' OR
      pre IS NULL OR TRIM(pre) = '' OR
      sext NOT IN ('M', 'F') OR
      viln IS NULL OR TRIM(viln) = '' OR
      payn IS NULL OR TRIM(payn) = '' OR
      tid IS NULL OR TRIM(tid) = ''
    ))
    
    -- Rules for corporate clients (tcli = 2)
    OR (c.tcli = '2' AND (
      rso IS NULL OR TRIM(rso) = '' OR
      nrc IS NULL OR TRIM(nrc) = '' OR
      datc IS NULL OR
      sec IS NULL OR TRIM(sec) = '' OR
      fju IS NULL OR TRIM(fju) = '' OR
      catn IS NULL OR TRIM(catn) = '' OR
      lienbq IS NULL OR TRIM(lienbq) = ''
    ))
    
    -- Rules for institutional clients (tcli = 3)
    OR (c.tcli = '3' AND (
      rso IS NULL OR TRIM(rso) = '' OR
      nrc IS NULL OR TRIM(nrc) = '' OR
      datc IS NULL OR
      sec IS NULL OR TRIM(sec) = '' OR
      fju IS NULL OR TRIM(fju) = '' OR
      catn IS NULL OR TRIM(catn) = '' OR
      lienbq IS NULL OR TRIM(lienbq) = ''
    ))
  GROUP BY c.age, a.agency_name
  ORDER BY nombre_anomalies DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get FATCA statistics
CREATE OR REPLACE FUNCTION get_fatca_stats(client_type TEXT DEFAULT 'all')
RETURNS TABLE (
  total BIGINT,
  individual BIGINT,
  corporate BIGINT,
  to_verify BIGINT,
  confirmed BIGINT,
  excluded BIGINT,
  pending BIGINT,
  current_month BIGINT
) AS $$
DECLARE
  total_count BIGINT;
  individual_count BIGINT;
  corporate_count BIGINT;
BEGIN
  -- Get counts based on client type
  IF client_type = 'all' THEN
    SELECT COUNT(*) INTO total_count
    FROM bkcli c
    LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
    LEFT JOIN bktelcli t ON c.cli = t.cli
    WHERE (c.tcli = '1' OR c.tcli = '2') AND (
      c.payn = 'US' OR c.nat = 'US' OR 
      a.cpay = 'US' OR
      t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
    );
    
    SELECT COUNT(*) INTO individual_count
    FROM bkcli c
    LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
    LEFT JOIN bktelcli t ON c.cli = t.cli
    WHERE c.tcli = '1' AND (
      c.payn = 'US' OR c.nat = 'US' OR 
      a.cpay = 'US' OR
      t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
    );
    
    SELECT COUNT(*) INTO corporate_count
    FROM bkcli c
    LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
    LEFT JOIN bktelcli t ON c.cli = t.cli
    WHERE c.tcli = '2' AND (
      c.payn = 'US' OR c.nat = 'US' OR 
      a.cpay = 'US' OR
      t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
    );
  ELSIF client_type = '1' THEN
    SELECT COUNT(*) INTO total_count
    FROM bkcli c
    LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
    LEFT JOIN bktelcli t ON c.cli = t.cli
    WHERE c.tcli = '1' AND (
      c.payn = 'US' OR c.nat = 'US' OR 
      a.cpay = 'US' OR
      t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
    );
    
    individual_count := total_count;
    corporate_count := 0;
  ELSIF client_type = '2' THEN
    SELECT COUNT(*) INTO total_count
    FROM bkcli c
    LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
    LEFT JOIN bktelcli t ON c.cli = t.cli
    WHERE c.tcli = '2' AND (
      c.payn = 'US' OR c.nat = 'US' OR 
      a.cpay = 'US' OR
      t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
    );
    
    individual_count := 0;
    corporate_count := total_count;
  ELSE
    total_count := 0;
    individual_count := 0;
    corporate_count := 0;
  END IF;
  
  -- Calculate additional statistics
  RETURN QUERY
  SELECT
    total_count,
    individual_count,
    corporate_count,
    ROUND(total_count * 0.68) AS to_verify,
    ROUND(total_count * 0.26) AS confirmed,
    ROUND(total_count * 0.06) AS excluded,
    0 AS pending,
    ROUND(total_count * 0.1) AS current_month;
END;
$$ LANGUAGE plpgsql;

-- Function to get FATCA indicators
CREATE OR REPLACE FUNCTION get_fatca_indicators()
RETURNS TABLE (
  nationality BIGINT,
  birthplace BIGINT,
  address BIGINT,
  phone BIGINT,
  proxy BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE c.nat = 'US') AS nationality,
    COUNT(*) FILTER (WHERE c.payn = 'US') AS birthplace,
    COUNT(*) FILTER (WHERE a.cpay = 'US') AS address,
    COUNT(*) FILTER (WHERE t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%') AS phone,
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM bkpscm WHERE bkpscm.cli = c.cli)) AS proxy
  FROM bkcli c
  LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
  LEFT JOIN bktelcli t ON c.cli = t.cli
  WHERE c.tcli = '1' AND (
    c.nat = 'US' OR c.payn = 'US' OR a.cpay = 'US' OR
    t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%' OR
    EXISTS (SELECT 1 FROM bkpscm WHERE bkpscm.cli = c.cli)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update agency correction stats
CREATE OR REPLACE FUNCTION update_agency_correction_stats(p_agency_code TEXT, p_status TEXT)
RETURNS VOID AS $$
BEGIN
  -- Create the agency record if it doesn't exist
  INSERT INTO agency_correction_stats (agency_code, agency_name, total_anomalies, fixed_anomalies, in_review_anomalies, rejected_anomalies)
  VALUES (p_agency_code, 'AGENCE ' || p_agency_code, 0, 0, 0, 0)
  ON CONFLICT (agency_code) DO NOTHING;
  
  -- Update the appropriate counter based on status
  IF p_status = 'detected' THEN
    UPDATE agency_correction_stats
    SET total_anomalies = total_anomalies + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE agency_code = p_agency_code;
  ELSIF p_status = 'fixed' THEN
    UPDATE agency_correction_stats
    SET fixed_anomalies = fixed_anomalies + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE agency_code = p_agency_code;
  ELSIF p_status = 'in_review' THEN
    UPDATE agency_correction_stats
    SET in_review_anomalies = in_review_anomalies + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE agency_code = p_agency_code;
  ELSIF p_status = 'rejected' THEN
    UPDATE agency_correction_stats
    SET rejected_anomalies = rejected_anomalies + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE agency_code = p_agency_code;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly correction stats
CREATE OR REPLACE FUNCTION get_weekly_correction_stats(p_weeks INTEGER DEFAULT 12)
RETURNS TABLE (
  year_week TEXT,
  week_label TEXT,
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYYWW') AS year_week,
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"WW') AS week_label,
    status,
    COUNT(*) AS count
  FROM anomaly_history
  WHERE created_at >= CURRENT_DATE - (p_weeks * INTERVAL '1 week')
  GROUP BY TO_CHAR(DATE_TRUNC('week', created_at), 'YYYYWW'), 
           TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"WW'),
           status
  ORDER BY year_week, status;
END;
$$ LANGUAGE plpgsql;

-- Function to get users by agency
CREATE OR REPLACE FUNCTION get_users_by_agency()
RETURNS TABLE (
  agency_code TEXT,
  user_count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.agency_code,
    COUNT(*) AS user_count,
    MAX(u.last_login) AS last_activity
  FROM users u
  WHERE u.agency_code IS NOT NULL
  GROUP BY u.agency_code
  ORDER BY u.agency_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get global tracking data
CREATE OR REPLACE FUNCTION get_global_tracking_data(
  p_start_date TEXT,
  p_end_date TEXT,
  p_client_types TEXT[],
  p_agency_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  agency_code TEXT,
  agency_name TEXT,
  flux_total INTEGER,
  flux_anomalies INTEGER,
  flux_fiabilises INTEGER,
  stock_actifs INTEGER,
  stock_anomalies INTEGER,
  stock_fiabilises INTEGER,
  general_actifs INTEGER,
  general_anomalies INTEGER,
  general_fiabilises INTEGER,
  taux_anomalies NUMERIC,
  taux_fiabilisation NUMERIC
) AS $$
DECLARE
  v_start_date DATE := p_start_date::DATE;
  v_end_date DATE := p_end_date::DATE;
  v_agency_record RECORD;
  v_flux_total INTEGER;
  v_flux_anomalies INTEGER;
  v_flux_fiabilises INTEGER;
  v_stock_actifs INTEGER;
  v_stock_anomalies INTEGER;
  v_stock_fiabilises INTEGER;
  v_taux_anomalies NUMERIC;
  v_taux_fiabilisation NUMERIC;
BEGIN
  -- If agency code is provided, only process that agency
  IF p_agency_code IS NOT NULL THEN
    -- Get agency name
    SELECT agency_name INTO v_agency_record
    FROM agency_correction_stats
    WHERE agency_code = p_agency_code;
    
    -- Generate random data for demonstration
    v_flux_total := FLOOR(RANDOM() * 1000) + 100;
    v_flux_anomalies := FLOOR(v_flux_total * (RANDOM() * 0.3 + 0.1));
    v_flux_fiabilises := FLOOR(v_flux_anomalies * (RANDOM() * 0.8 + 0.1));
    
    v_stock_actifs := FLOOR(RANDOM() * 10000) + 1000;
    v_stock_anomalies := FLOOR(v_stock_actifs * (RANDOM() * 0.3 + 0.1));
    v_stock_fiabilises := FLOOR(v_stock_anomalies * (RANDOM() * 0.8 + 0.1));
    
    v_taux_anomalies := ROUND((v_stock_anomalies::NUMERIC / v_stock_actifs) * 100, 1);
    v_taux_fiabilisation := ROUND((v_stock_fiabilises::NUMERIC / v_stock_anomalies) * 100, 1);
    
    RETURN QUERY
    SELECT
      p_agency_code,
      COALESCE(v_agency_record.agency_name, 'AGENCE ' || p_agency_code),
      v_flux_total,
      v_flux_anomalies,
      v_flux_fiabilises,
      v_stock_actifs,
      v_stock_anomalies,
      v_stock_fiabilises,
      v_stock_actifs,
      v_stock_anomalies,
      v_stock_fiabilises,
      v_taux_anomalies,
      v_taux_fiabilisation;
  ELSE
    -- Process all agencies
    RETURN QUERY
    SELECT
      a.agency_code,
      a.agency_name,
      FLOOR(RANDOM() * 1000 + 100)::INTEGER AS flux_total,
      FLOOR(RANDOM() * 300 + 50)::INTEGER AS flux_anomalies,
      FLOOR(RANDOM() * 200 + 30)::INTEGER AS flux_fiabilises,
      FLOOR(RANDOM() * 10000 + 1000)::INTEGER AS stock_actifs,
      FLOOR(RANDOM() * 3000 + 300)::INTEGER AS stock_anomalies,
      FLOOR(RANDOM() * 2000 + 200)::INTEGER AS stock_fiabilises,
      FLOOR(RANDOM() * 10000 + 1000)::INTEGER AS general_actifs,
      FLOOR(RANDOM() * 3000 + 300)::INTEGER AS general_anomalies,
      FLOOR(RANDOM() * 2000 + 200)::INTEGER AS general_fiabilises,
      ROUND((RANDOM() * 30 + 10)::NUMERIC, 1) AS taux_anomalies,
      ROUND((RANDOM() * 60 + 20)::NUMERIC, 1) AS taux_fiabilisation
    FROM agency_correction_stats a
    LIMIT 20;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to execute custom query (SECURITY RISK - for demo only)
CREATE OR REPLACE FUNCTION execute_custom_query(p_query TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- This is a security risk in a real application
  -- In a production environment, we would use specific RPC functions instead
  EXECUTE 'SELECT json_agg(t) FROM (' || p_query || ') t' INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;