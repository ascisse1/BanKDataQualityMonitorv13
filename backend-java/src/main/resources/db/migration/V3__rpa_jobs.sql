/*
  # Add RPA Jobs Tracking

  1. New Tables
    - `rpa_jobs`
      - `id` (bigserial, primary key)
      - `job_id` (varchar, unique) - UUID for external tracking
      - `ticket_id` (bigint) - Reference to ticket
      - `process_instance_id` (varchar) - Camunda process instance
      - `action` (varchar) - RPA action type
      - `status` (varchar) - Job status
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `error_message` (text)
      - `result_data` (text)
      - `retry_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Indexes for performance
    - Foreign key to tickets
*/

CREATE TABLE IF NOT EXISTS rpa_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL UNIQUE,
    ticket_id BIGINT NOT NULL,
    process_instance_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    result_data TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_rpa_job_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rpa_jobs_job_id ON rpa_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_ticket_id ON rpa_jobs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_status ON rpa_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_process_instance ON rpa_jobs(process_instance_id);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_started_at ON rpa_jobs(started_at);

CREATE OR REPLACE FUNCTION update_rpa_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rpa_job_timestamp
    BEFORE UPDATE ON rpa_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_rpa_job_timestamp();

COMMENT ON TABLE rpa_jobs IS 'Tracks RPA (UiPath) job executions for ticket processing';
COMMENT ON COLUMN rpa_jobs.job_id IS 'Unique identifier for tracking with external RPA system';
COMMENT ON COLUMN rpa_jobs.status IS 'Job status: PENDING, RUNNING, COMPLETED, FAILED';
COMMENT ON COLUMN rpa_jobs.action IS 'RPA action: UPDATE_AMPLITUDE, FETCH_DATA, etc.';
