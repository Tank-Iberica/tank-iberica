-- ==========================================================
-- Migration 00034: Activity logs table
-- ==========================================================
-- Tracks all admin, dealer, system, and cron actions for
-- the system config page (/admin/config/system).
-- ==========================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  user_id UUID,
  actor_type VARCHAR NOT NULL, -- 'admin', 'dealer', 'system', 'cron'
  action VARCHAR NOT NULL,     -- 'create', 'update', 'delete', 'publish', 'translate', 'login'
  entity_type VARCHAR,         -- 'vehicle', 'article', 'dealer', 'category', 'config'
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_vertical ON activity_logs(vertical, created_at DESC);
CREATE INDEX idx_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can read logs
CREATE POLICY "logs_admin_read" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- Service role can insert (for system/cron actions)
CREATE POLICY "logs_admin_insert" ON activity_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
