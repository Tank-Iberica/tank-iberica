-- Migration 00069: Fix infra_metrics missing columns
-- Table was created by 00065 with a different schema than 00053 expected.
-- 00053 likely failed (FK dependency); 00065 created a simplified version.
-- This migration adds the columns required by the application code (useInfraMetrics.ts).

ALTER TABLE public.infra_metrics
  ADD COLUMN IF NOT EXISTS component VARCHAR,
  ADD COLUMN IF NOT EXISTS metric_name VARCHAR,
  ADD COLUMN IF NOT EXISTS metric_value NUMERIC,
  ADD COLUMN IF NOT EXISTS metric_limit NUMERIC,
  ADD COLUMN IF NOT EXISTS usage_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes used by useInfraMetrics.ts
CREATE INDEX IF NOT EXISTS idx_infra_metrics_component
  ON public.infra_metrics(component, metric_name);

CREATE INDEX IF NOT EXISTS idx_infra_metrics_recorded
  ON public.infra_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_infra_metrics_usage
  ON public.infra_metrics(usage_percent DESC) WHERE usage_percent IS NOT NULL;
