-- #36: Add negotiated_price_cents to leads for tracking price negotiations
ALTER TABLE leads ADD COLUMN IF NOT EXISTS negotiated_price_cents BIGINT;

COMMENT ON COLUMN leads.negotiated_price_cents IS 'Final negotiated price in cents, visible when closing lead as won';
