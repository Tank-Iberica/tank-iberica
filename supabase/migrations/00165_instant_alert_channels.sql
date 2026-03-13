-- Migration 00165: Add channels column to search_alerts for instant alerts (#212)
-- Allows users to choose notification channels per alert (email, push, whatsapp)

ALTER TABLE search_alerts
ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '["email"]'::jsonb;

COMMENT ON COLUMN search_alerts.channels IS 'Notification channels for this alert: email, push, whatsapp. Default: ["email"]';

-- Index for quickly finding active instant alerts
CREATE INDEX IF NOT EXISTS idx_search_alerts_active_frequency
ON search_alerts (active, frequency)
WHERE active = true;
