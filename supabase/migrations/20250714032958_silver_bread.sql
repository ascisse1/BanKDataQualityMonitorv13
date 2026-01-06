/*
  # Create logging function and trigger

  1. New Functions
    - `log_action` - Function to log user actions
    - `trigger_log_action` - Trigger function for automatic logging
  
  2. New Table
    - `logs` - Table to store user action logs
  
  3. Triggers
    - Add triggers to relevant tables
*/

-- Create logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_role TEXT,
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index on logs table
CREATE INDEX IF NOT EXISTS idx_logs_user_role ON logs(user_role);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_table_name ON logs(table_name);

-- Enable RLS on logs table
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policy for logs table
DO $$
BEGIN
  -- Drop policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'logs' AND policyname = 'logs_select_policy_20250715'
  ) THEN
    DROP POLICY logs_select_policy_20250715 ON logs;
  END IF;
END $$;

-- Create new policy
CREATE POLICY logs_select_policy_20250715
  ON logs
  FOR SELECT
  TO public
  USING (true);

-- Create log_action function
CREATE OR REPLACE FUNCTION log_action(
  action_text TEXT,
  table_name TEXT DEFAULT NULL,
  record_id TEXT DEFAULT NULL,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO logs (user_role, action, table_name, record_id, details)
  VALUES (current_user, action_text, table_name, record_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for automatic logging
CREATE OR REPLACE FUNCTION trigger_log_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_action(
      'inserted record', 
      TG_TABLE_NAME, 
      NEW.id::TEXT, 
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_action(
      'updated record', 
      TG_TABLE_NAME, 
      NEW.id::TEXT, 
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_action(
      'deleted record', 
      TG_TABLE_NAME, 
      OLD.id::TEXT, 
      to_jsonb(OLD)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example of how to add a trigger to a table (uncomment and modify as needed)
-- CREATE TRIGGER log_users_changes
--   AFTER INSERT OR UPDATE OR DELETE ON users
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_log_action();

-- Example of how to manually log an action
-- SELECT log_action('custom action', 'custom_table', '123', '{"key": "value"}'::jsonb);

-- Test the function
INSERT INTO logs (user_role, action)
VALUES (current_user, 'inserted client');