/*
  # Create role function and base tables
  
  1. Create Functions
    - `role()` function to get current user role for RLS policies
  
  2. Base Tables
    - `agency_correction_stats` - Statistics for agency corrections
    - `anomaly_history` - History of anomaly corrections
    - `data_load_history` - History of data loads
    - `users` - User accounts
    - `user_audit_log` - Audit log for user actions
  
  3. Security
    - Enable RLS on all tables
    - Create policies for each table
*/

-- First, create the role() function needed for RLS policies
CREATE OR REPLACE FUNCTION public.role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'role', ''),
    'anon'
  );
$$;

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

-- Create users table
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
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER
);

-- Create user_audit_log table
CREATE TABLE IF NOT EXISTS user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_anomaly_history_cli ON anomaly_history(cli);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_agency_code ON anomaly_history(agency_code);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_status ON anomaly_history(status);
CREATE INDEX IF NOT EXISTS idx_data_load_history_table_name ON data_load_history(table_name);
CREATE INDEX IF NOT EXISTS idx_data_load_history_load_status ON data_load_history(load_status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_agency_code ON users(agency_code);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action ON user_audit_log(action);

-- Enable Row Level Security
ALTER TABLE agency_correction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_load_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
DECLARE
  _policy_name text;
  _table_name text;
BEGIN
  FOR _table_name, _policy_name IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _policy_name, _table_name);
  END LOOP;
END
$$;

-- Create policies for read access with unique names
CREATE POLICY "stats_read_policy_20250715" 
  ON agency_correction_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "anomaly_history_read_policy_20250715" 
  ON anomaly_history
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "data_load_history_read_policy_20250715" 
  ON data_load_history
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "users_read_policy_20250715" 
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "audit_log_read_policy_20250715" 
  ON user_audit_log
  FOR SELECT
  TO public
  USING (true);

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role, department, status)
VALUES ('admin', 'admin@banque.ml', '$2a$10$1YlYbYVIH4yhmqT.3wfRJeP7SvM/8YV1XjQwQvTZ.KN9EZHKkZILe', 'Administrateur Système', 'admin', 'IT', 'active')
ON CONFLICT (username) DO NOTHING;

-- Create default auditor user (password: audit123)
INSERT INTO users (username, email, password_hash, full_name, role, department, status)
VALUES ('auditor', 'audit@banque.ml', '$2a$10$1YlYbYVIH4yhmqT.3wfRJeP7SvM/8YV1XjQwQvTZ.KN9EZHKkZILe', 'Auditeur Principal', 'auditor', 'Audit', 'active')
ON CONFLICT (username) DO NOTHING;

-- Create default user (password: user123)
INSERT INTO users (username, email, password_hash, full_name, role, department, status)
VALUES ('user', 'user@banque.ml', '$2a$10$1YlYbYVIH4yhmqT.3wfRJeP7SvM/8YV1XjQwQvTZ.KN9EZHKkZILe', 'Utilisateur Standard', 'user', 'Opérations', 'active')
ON CONFLICT (username) DO NOTHING;