-- ================================================
-- 00043: Email system — email_logs + email_preferences
-- ================================================

-- A. Email logs table (audit trail for all sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template_key VARCHAR NOT NULL,
  subject TEXT,
  variables JSONB DEFAULT '{}',
  status VARCHAR DEFAULT 'queued',  -- 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  resend_id TEXT,                    -- Resend message ID for tracking
  error TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_vertical ON email_logs(vertical, created_at DESC);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own email logs
CREATE POLICY "email_logs_own_read" ON email_logs FOR SELECT
  USING (recipient_user_id = auth.uid());

-- Admin has full access
CREATE POLICY "email_logs_admin_all" ON email_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- B. Email preferences table (user opt-in/out per email type)
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR NOT NULL,  -- matches template_key
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_email_prefs_user ON email_preferences(user_id);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Users manage their own preferences
CREATE POLICY "email_prefs_own_read" ON email_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "email_prefs_own_insert" ON email_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "email_prefs_own_update" ON email_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Admin has full access
CREATE POLICY "email_prefs_admin_all" ON email_preferences FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- C. Add unsubscribe_token to users for one-click unsubscribe
ALTER TABLE users ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unsub_token ON users(unsubscribe_token) WHERE unsubscribe_token IS NOT NULL;

COMMENT ON TABLE email_logs IS 'Audit trail for all emails sent via Resend. Tracks delivery, opens, clicks.';
COMMENT ON TABLE email_preferences IS 'User opt-in/out preferences per email type. Defaults to enabled.';
