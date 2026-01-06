/*
  # Create anomaly tracking tables

  1. New Tables
    - `agency_correction_stats` - Tracks correction statistics by agency
    - `anomaly_history` - Records history of anomaly corrections
    - `data_load_history` - Tracks data loading operations
  
  2. Security
    - Enable RLS on all tables
    - Add policies for read access
*/

-- Create agency_correction_stats table
CREATE TABLE IF NOT EXISTS agency_correction_stats (
  id SERIAL PRIMARY KEY,
  agency_code CHAR(5) NOT NULL UNIQUE,
  agency_name VARCHAR(100),
  total_anomalies INTEGER DEFAULT 0,
  fixed_anomalies INTEGER DEFAULT 0,
  in_review_anomalies INTEGER DEFAULT 0,
  rejected_anomalies INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create anomaly_history table
CREATE TABLE IF NOT EXISTS anomaly_history (
  id SERIAL PRIMARY KEY,
  cli CHAR(15) NOT NULL,
  field VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status VARCHAR(20) NOT NULL,
  agency_code CHAR(5),
  user_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create data_load_history table
CREATE TABLE IF NOT EXISTS data_load_history (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  records_count INTEGER DEFAULT 0,
  load_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  load_status VARCHAR(20) NOT NULL,
  error_message TEXT,
  loaded_by VARCHAR(50),
  execution_time_ms INTEGER
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_anomaly_history_cli ON anomaly_history(cli);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_agency_code ON anomaly_history(agency_code);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_status ON anomaly_history(status);
CREATE INDEX IF NOT EXISTS idx_data_load_history_table_name ON data_load_history(table_name);
CREATE INDEX IF NOT EXISTS idx_data_load_history_load_status ON data_load_history(load_status);

-- Enable Row Level Security
ALTER TABLE agency_correction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_load_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop policy for agency_correction_stats if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agency_correction_stats' 
    AND policyname = 'Tous les utilisateurs peuvent lire les statistiques de correcti'
  ) THEN
    DROP POLICY "Tous les utilisateurs peuvent lire les statistiques de correcti" ON agency_correction_stats;
  END IF;
  
  -- Drop policy for anomaly_history if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'anomaly_history' 
    AND policyname = 'Tous les utilisateurs peuvent lire l''historique des anomalies'
  ) THEN
    DROP POLICY "Tous les utilisateurs peuvent lire l'historique des anomalies" ON anomaly_history;
  END IF;
  
  -- Drop policy for data_load_history if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data_load_history' 
    AND policyname = 'Tous les utilisateurs peuvent lire l''historique des chargements'
  ) THEN
    DROP POLICY "Tous les utilisateurs peuvent lire l'historique des chargements" ON data_load_history;
  END IF;
END $$;

-- Create policies with unique names to avoid conflicts
CREATE POLICY "agency_correction_stats_read_policy_20250714"
  ON agency_correction_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "anomaly_history_read_policy_20250714"
  ON anomaly_history
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "data_load_history_read_policy_20250714"
  ON data_load_history
  FOR SELECT
  TO public
  USING (true);