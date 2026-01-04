/*
  # Upsert Example Migration
  
  1. Demonstrates INSERT ... ON CONFLICT (upsert) functionality
  2. Creates a sample table for demonstration
  3. Shows different upsert patterns
*/

-- Create a sample table for demonstration
CREATE TABLE IF NOT EXISTS sample_clients (
  client_id VARCHAR(15) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Basic INSERT ... ON CONFLICT (DO NOTHING)
INSERT INTO sample_clients (client_id, name, email)
VALUES ('CLI001', 'John Doe', 'john@example.com')
ON CONFLICT (client_id) DO NOTHING;

-- INSERT ... ON CONFLICT (DO UPDATE)
INSERT INTO sample_clients (client_id, name, email, status)
VALUES ('CLI002', 'Jane Smith', 'jane@example.com', 'active')
ON CONFLICT (client_id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

-- Multiple rows with ON CONFLICT
INSERT INTO sample_clients (client_id, name, email, status)
VALUES 
  ('CLI003', 'Alice Johnson', 'alice@example.com', 'active'),
  ('CLI004', 'Bob Brown', 'bob@example.com', 'inactive'),
  ('CLI005', 'Charlie Davis', 'charlie@example.com', 'active')
ON CONFLICT (client_id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

-- ON CONFLICT on a different unique constraint (email)
INSERT INTO sample_clients (client_id, name, email)
VALUES ('CLI006', 'David Wilson', 'david@example.com')
ON CONFLICT (email) 
DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = CURRENT_TIMESTAMP;

-- Conditional update using CASE expression
INSERT INTO sample_clients (client_id, name, email, status)
VALUES ('CLI007', 'Eva Martinez', 'eva@example.com', 'active')
ON CONFLICT (client_id) 
DO UPDATE SET 
  status = CASE 
    WHEN sample_clients.status = 'inactive' THEN EXCLUDED.status
    ELSE sample_clients.status
  END,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

-- Enable RLS on the table
ALTER TABLE sample_clients ENABLE ROW LEVEL SECURITY;

-- Create a policy for the table
CREATE POLICY "Users can read sample clients"
  ON sample_clients
  FOR SELECT
  TO public
  USING (true);