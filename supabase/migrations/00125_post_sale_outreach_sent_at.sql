-- Add post_sale_outreach_sent_at to leads table
-- Tracks whether the buyer received a post-sale services email (F6 — Bloque 21)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS post_sale_outreach_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_post_sale_outreach_sent_at
  ON leads (post_sale_outreach_sent_at)
  WHERE post_sale_outreach_sent_at IS NULL;
