-- ── Migration 00075: Admin Audit Log ──────────────────────────────────────────
-- Records all admin actions for security audit trail (§2.4 Plan Maestro).
-- Append-only table — rows are NEVER deleted (retention policy: 2 years).

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email   TEXT,
  action        TEXT        NOT NULL,   -- e.g. 'vehicle.delete', 'dealer.suspend'
  resource_type TEXT        NOT NULL,   -- e.g. 'vehicle', 'dealer', 'user'
  resource_id   TEXT,                  -- UUID or slug of the affected resource
  metadata      JSONB       NOT NULL DEFAULT '{}',
  ip            TEXT,
  user_agent    TEXT
);

-- Indexes for admin dashboard lookups
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor    ON admin_audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action   ON admin_audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_ts       ON admin_audit_log (created_at DESC);

-- RLS: only service role can access (admin UI uses service role client)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE admin_audit_log IS
  'Append-only admin action audit trail. Written via server/utils/auditLog.ts. Retention: 2 years.';
