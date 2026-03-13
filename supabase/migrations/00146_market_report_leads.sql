-- Migration: 00146_market_report_leads
-- Purpose: Lead magnet tables for quarterly market report downloads
-- Agent D - #67

-- Tracks generated quarterly market reports (stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS market_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter      TEXT        NOT NULL UNIQUE,       -- 'Q1-2026', 'Q2-2026', etc.
  locale       TEXT        NOT NULL DEFAULT 'es',
  storage_path TEXT,                              -- path in 'reports' bucket, nullable if not yet uploaded
  report_data  JSONB       NOT NULL DEFAULT '{}', -- snapshot of key metrics
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_reports_quarter ON market_reports (quarter);
CREATE INDEX IF NOT EXISTS idx_market_reports_generated_at ON market_reports (generated_at DESC);

ALTER TABLE market_reports ENABLE ROW LEVEL SECURITY;

-- Public can read report metadata (to show stats in the gate component)
CREATE POLICY "public_select_market_reports"
  ON market_reports FOR SELECT
  USING (true);

-- Only service_role can insert/update/delete
CREATE POLICY "service_role_all_market_reports"
  ON market_reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Tracks email captures for the lead magnet
CREATE TABLE IF NOT EXISTS market_report_leads (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        NOT NULL,
  quarter      TEXT        NOT NULL,
  locale       TEXT        NOT NULL DEFAULT 'es',
  ip_hash      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_report_leads_email   ON market_report_leads (email);
CREATE INDEX IF NOT EXISTS idx_market_report_leads_quarter ON market_report_leads (quarter);
CREATE INDEX IF NOT EXISTS idx_market_report_leads_created ON market_report_leads (created_at DESC);

ALTER TABLE market_report_leads ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert their own lead (email capture)
CREATE POLICY "anon_insert_market_report_leads"
  ON market_report_leads FOR INSERT
  WITH CHECK (true);

-- Only service_role can read leads (admin CRM)
CREATE POLICY "service_role_all_market_report_leads"
  ON market_report_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
