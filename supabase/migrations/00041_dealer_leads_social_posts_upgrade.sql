-- ================================================
-- 00041: Dealer leads + social posts schema upgrades
-- ================================================
-- Upgrade dealer_leads for scraping-based captación (Anexo I.2).
-- Upgrade social_posts for auto-publish flow (Anexo I.3).
-- ================================================

-- A. Upgrade dealer_leads table
ALTER TABLE dealer_leads
  ADD COLUMN IF NOT EXISTS vertical VARCHAR DEFAULT 'tracciona',
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS active_listings INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vehicle_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_notes TEXT;

-- Add unique constraint for deduplication (source + company_name)
-- Drop existing index if any, then create
CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_leads_unique
  ON dealer_leads(source, company_name);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_dealer_leads_source
  ON dealer_leads(source);

-- B. Upgrade social_posts table
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS vertical VARCHAR DEFAULT 'tracciona',
  ADD COLUMN IF NOT EXISTS impressions INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- C. Server route for generating social posts when vehicle is published
-- (Handled in application code, not DB trigger, since it needs Claude API)

COMMENT ON TABLE dealer_leads IS 'Leads from competitor scraping for dealer acquisition. Deduped by source+company_name.';
COMMENT ON TABLE social_posts IS 'Social media posts queue. Status: draft → pending → approved → posted (or rejected/failed).';
