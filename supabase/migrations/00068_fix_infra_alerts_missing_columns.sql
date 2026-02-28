-- Migration 00068: Fix infra_alerts missing columns
-- The table was created by 00065 with a different schema than 00053 expected.
-- 00053 likely failed (FK to users before it existed); 00065 created a simplified version.
-- This migration adds the columns required by the application code.

ALTER TABLE public.infra_alerts
  ADD COLUMN IF NOT EXISTS component VARCHAR,
  ADD COLUMN IF NOT EXISTS metric_name VARCHAR,
  ADD COLUMN IF NOT EXISTS alert_level VARCHAR,
  ADD COLUMN IF NOT EXISTS usage_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id);

-- Indexes used by server/api/infra/alerts.get.ts
CREATE INDEX IF NOT EXISTS idx_infra_alerts_unack
  ON public.infra_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_infra_alerts_component
  ON public.infra_alerts(component, sent_at DESC);
