-- Migration: Add device_type, platform, UTM, and version columns to analytics_events
-- Purpose: The useAnalyticsTracking composable already sends these fields but the columns
-- were missing, causing silent insert failures. This migration adds the columns so
-- device/platform (#47), UTM attribution (#42), and schema versioning work properly.

-- Device & platform tracking
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS device_type VARCHAR(10);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS platform VARCHAR(10);

-- UTM attribution tracking
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_term VARCHAR(200);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_content VARCHAR(200);

-- Schema version for future-proofing
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS version SMALLINT DEFAULT 1;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_device ON analytics_events(device_type) WHERE device_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform ON analytics_events(platform) WHERE platform IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_source ON analytics_events(utm_source) WHERE utm_source IS NOT NULL;

COMMENT ON COLUMN analytics_events.device_type IS 'Client device: mobile, tablet, desktop';
COMMENT ON COLUMN analytics_events.platform IS 'Client OS: ios, android, windows, macos, linux, other';
COMMENT ON COLUMN analytics_events.utm_source IS 'UTM source parameter from URL';
COMMENT ON COLUMN analytics_events.utm_medium IS 'UTM medium parameter from URL';
COMMENT ON COLUMN analytics_events.utm_campaign IS 'UTM campaign parameter from URL';
COMMENT ON COLUMN analytics_events.utm_term IS 'UTM term parameter from URL';
COMMENT ON COLUMN analytics_events.utm_content IS 'UTM content parameter from URL';
COMMENT ON COLUMN analytics_events.version IS 'Event schema version for backward compat';
