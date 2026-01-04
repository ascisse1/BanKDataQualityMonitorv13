/*
  # Add KPI Tracking System

  1. New Tables
    - `kpis`
      - `id` (bigserial, primary key)
      - `period_date` (date) - The date this KPI represents
      - `agency_code` (varchar) - Agency code or 'GLOBAL'
      - `kpi_type` (varchar) - Type: CLOSURE_RATE, SLA_COMPLIANCE, AVG_RESOLUTION_TIME
      - `kpi_value` (numeric) - The KPI value (percentage or hours)
      - `target_value` (numeric) - Target value for this KPI
      - `tickets_total` (integer)
      - `tickets_closed` (integer)
      - `tickets_sla_respected` (integer)
      - `tickets_sla_breached` (integer)
      - `avg_resolution_time_hours` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Performance indexes for queries
    - Unique constraint on period_date + agency_code + kpi_type
*/

CREATE TABLE IF NOT EXISTS kpis (
    id BIGSERIAL PRIMARY KEY,
    period_date DATE NOT NULL,
    agency_code VARCHAR(50),
    kpi_type VARCHAR(100) NOT NULL,
    kpi_value NUMERIC(10, 2) NOT NULL,
    target_value NUMERIC(10, 2),
    tickets_total INTEGER DEFAULT 0,
    tickets_closed INTEGER DEFAULT 0,
    tickets_sla_respected INTEGER DEFAULT 0,
    tickets_sla_breached INTEGER DEFAULT 0,
    avg_resolution_time_hours NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_kpi_period_agency_type UNIQUE (period_date, agency_code, kpi_type)
);

CREATE INDEX IF NOT EXISTS idx_kpis_period_date ON kpis(period_date);
CREATE INDEX IF NOT EXISTS idx_kpis_agency_code ON kpis(agency_code);
CREATE INDEX IF NOT EXISTS idx_kpis_kpi_type ON kpis(kpi_type);
CREATE INDEX IF NOT EXISTS idx_kpis_period_agency ON kpis(period_date, agency_code);

CREATE OR REPLACE FUNCTION update_kpi_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kpi_timestamp
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

COMMENT ON TABLE kpis IS 'Daily KPI metrics for ticket processing performance';
COMMENT ON COLUMN kpis.kpi_type IS 'KPI types: CLOSURE_RATE, SLA_COMPLIANCE, AVG_RESOLUTION_TIME';
COMMENT ON COLUMN kpis.agency_code IS 'Agency code or GLOBAL for bank-wide metrics';
