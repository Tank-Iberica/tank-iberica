-- ============================================================================
-- Migration 00090: RBAC — Granular Role-Based Access Control
-- ============================================================================
-- Roles: super_admin, admin, editor, viewer
-- Permissions: per-resource CRUD grants
-- ============================================================================

-- -------------------------------------------------------
-- 1. Roles table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  vertical TEXT DEFAULT NULL, -- NULL = global, otherwise scoped to vertical
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, vertical)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- -------------------------------------------------------
-- 2. Permissions table (optional granular override)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  resource TEXT NOT NULL,  -- e.g., 'vehicles', 'dealers', 'news', 'config'
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, resource, action)
);

-- -------------------------------------------------------
-- 3. Default permissions seed
-- -------------------------------------------------------
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  -- super_admin: everything
  ('super_admin', '*', 'manage', true),
  -- admin: most resources
  ('admin', 'vehicles', 'manage', true),
  ('admin', 'dealers', 'manage', true),
  ('admin', 'news', 'manage', true),
  ('admin', 'config', 'read', true),
  ('admin', 'config', 'update', true),
  ('admin', 'users', 'read', true),
  ('admin', 'users', 'update', true),
  ('admin', 'analytics', 'read', true),
  ('admin', 'billing', 'read', true),
  -- editor: content only
  ('editor', 'vehicles', 'create', true),
  ('editor', 'vehicles', 'read', true),
  ('editor', 'vehicles', 'update', true),
  ('editor', 'news', 'create', true),
  ('editor', 'news', 'read', true),
  ('editor', 'news', 'update', true),
  ('editor', 'dealers', 'read', true),
  ('editor', 'analytics', 'read', true),
  -- viewer: read-only
  ('viewer', 'vehicles', 'read', true),
  ('viewer', 'dealers', 'read', true),
  ('viewer', 'news', 'read', true),
  ('viewer', 'analytics', 'read', true)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- 4. RLS policies
-- -------------------------------------------------------
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- user_roles: users see their own; admins see all
CREATE POLICY "Users can read own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- role_permissions: readable by authenticated users
CREATE POLICY "Authenticated users can read permissions"
  ON role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only super_admin can modify permissions
CREATE POLICY "Super admins manage permissions"
  ON role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
    )
  );

-- -------------------------------------------------------
-- 5. Helper function: check user permission
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON (
      rp.role = ur.role
      AND (rp.resource = p_resource OR rp.resource = '*')
      AND (rp.action = p_action OR rp.action = 'manage')
      AND rp.allowed = true
    )
    WHERE ur.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
