-- Migration: CRM pipeline for dealer management (F40)
-- Tracks dealers through sales pipeline stages with notes and next actions.

-- Pipeline stage enum
DO $$ BEGIN
  CREATE TYPE crm_pipeline_stage AS ENUM (
    'contacted',
    'demo',
    'negotiating',
    'closed',
    'lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Main table
CREATE TABLE IF NOT EXISTS crm_pipeline (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id         UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  stage             crm_pipeline_stage NOT NULL DEFAULT 'contacted',
  notes             TEXT,
  next_action_date  DATE,
  next_action_desc  TEXT,
  assigned_to       UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata          JSONB DEFAULT '{}'::JSONB,
  entered_stage_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT crm_pipeline_unique_dealer UNIQUE (dealer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stage
  ON crm_pipeline (stage);

CREATE INDEX IF NOT EXISTS idx_crm_pipeline_next_action
  ON crm_pipeline (next_action_date)
  WHERE next_action_date IS NOT NULL;

-- Stage history for tracking conversion times
CREATE TABLE IF NOT EXISTS crm_pipeline_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id   UUID NOT NULL REFERENCES crm_pipeline(id) ON DELETE CASCADE,
  from_stage    crm_pipeline_stage,
  to_stage      crm_pipeline_stage NOT NULL,
  changed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_pipeline_history_pipeline
  ON crm_pipeline_history (pipeline_id, created_at);

-- Updated at trigger
CREATE OR REPLACE TRIGGER set_updated_at_crm_pipeline
  BEFORE UPDATE ON crm_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE crm_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_history ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY crm_pipeline_admin_all ON crm_pipeline
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY crm_pipeline_history_admin_all ON crm_pipeline_history
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

COMMENT ON TABLE crm_pipeline IS 'CRM pipeline tracking dealer sales progression';
COMMENT ON TABLE crm_pipeline_history IS 'History of stage changes for CRM pipeline items';
