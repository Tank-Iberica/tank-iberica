-- #D17 — Multi-user dealer accounts
-- RBAC per dealer: owner (full), manager (edit vehicles/leads), viewer (read-only).
-- Invitation flow with email tokens.

-- ── Dealer team roles enum ─────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE dealer_team_role AS ENUM ('owner', 'manager', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Dealer team members table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dealer_team_members (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dealer_id       UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  role            dealer_team_role NOT NULL DEFAULT 'viewer',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked')),
  invite_token    TEXT UNIQUE,
  invited_by      UUID REFERENCES auth.users(id),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at     TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  UNIQUE (dealer_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_dealer ON dealer_team_members (dealer_id, status);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON dealer_team_members (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_invite_token ON dealer_team_members (invite_token) WHERE invite_token IS NOT NULL;

-- RLS
ALTER TABLE dealer_team_members ENABLE ROW LEVEL SECURITY;

-- Owner/manager can see their dealer's team members
DROP POLICY IF EXISTS team_members_select ON dealer_team_members;
CREATE POLICY team_members_select ON dealer_team_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM dealer_team_members dtm
      WHERE dtm.dealer_id = dealer_team_members.dealer_id
        AND dtm.status = 'active'
    )
  );

-- Only owners can insert (invite) team members
DROP POLICY IF EXISTS team_members_insert ON dealer_team_members;
CREATE POLICY team_members_insert ON dealer_team_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM dealer_team_members dtm
      WHERE dtm.dealer_id = dealer_team_members.dealer_id
        AND dtm.role = 'owner'
        AND dtm.status = 'active'
    )
  );

-- Only owners can update team members
DROP POLICY IF EXISTS team_members_update ON dealer_team_members;
CREATE POLICY team_members_update ON dealer_team_members
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM dealer_team_members dtm
      WHERE dtm.dealer_id = dealer_team_members.dealer_id
        AND dtm.role = 'owner'
        AND dtm.status = 'active'
    )
  );

-- Service role bypass for server operations
DROP POLICY IF EXISTS team_members_service ON dealer_team_members;
CREATE POLICY team_members_service ON dealer_team_members
  FOR ALL USING (auth.role() = 'service_role');

-- ── RPC: check_dealer_permission ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_dealer_permission(
  p_user_id UUID,
  p_dealer_id UUID,
  p_required_role dealer_team_role DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role dealer_team_role;
  v_role_level INT;
  v_required_level INT;
BEGIN
  SELECT role INTO v_role
  FROM dealer_team_members
  WHERE dealer_id = p_dealer_id
    AND user_id = p_user_id
    AND status = 'active';

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Role hierarchy: owner(3) > manager(2) > viewer(1)
  v_role_level := CASE v_role
    WHEN 'owner' THEN 3
    WHEN 'manager' THEN 2
    WHEN 'viewer' THEN 1
  END;

  v_required_level := CASE p_required_role
    WHEN 'owner' THEN 3
    WHEN 'manager' THEN 2
    WHEN 'viewer' THEN 1
  END;

  RETURN v_role_level >= v_required_level;
END;
$$;

GRANT EXECUTE ON FUNCTION check_dealer_permission TO authenticated, service_role;

-- ── RPC: accept_dealer_invite ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION accept_dealer_invite(
  p_invite_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member dealer_team_members%ROWTYPE;
BEGIN
  SELECT * INTO v_member
  FROM dealer_team_members
  WHERE invite_token = p_invite_token
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  UPDATE dealer_team_members
  SET
    user_id = auth.uid(),
    status = 'active',
    accepted_at = now(),
    invite_token = NULL
  WHERE id = v_member.id;

  RETURN jsonb_build_object(
    'success', true,
    'dealer_id', v_member.dealer_id,
    'role', v_member.role::TEXT
  );
END;
$$;

GRANT EXECUTE ON FUNCTION accept_dealer_invite TO authenticated;
