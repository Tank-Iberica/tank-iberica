-- #268 — A/B Testing Infrastructure
-- Feature flags-based experiments with consistent assignment and analytics tracking.

-- ── Experiments table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS experiments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,           -- 'checkout_cta_test'
  name        TEXT NOT NULL,                  -- 'Checkout CTA Color Test'
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'draft'   -- draft, active, paused, completed
    CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  variants    JSONB NOT NULL DEFAULT '[]',    -- [{"id":"control","weight":50},{"id":"variant_a","weight":50}]
  target_sample_size INT DEFAULT 1000,        -- target participants before auto-pause
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);

-- ── Experiment assignments ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS experiment_assignments (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  experiment_id   UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  user_id         UUID,                       -- nullable for anonymous visitors
  anonymous_id    TEXT,                        -- cookie-based ID for anonymous
  variant_id      TEXT NOT NULL,              -- 'control', 'variant_a', etc.
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, user_id),
  UNIQUE (experiment_id, anonymous_id)
);

CREATE INDEX IF NOT EXISTS idx_exp_assignments_experiment ON experiment_assignments (experiment_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_user ON experiment_assignments (user_id) WHERE user_id IS NOT NULL;

-- ── Experiment events (conversions) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS experiment_events (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  experiment_id   UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id      TEXT NOT NULL,
  event_type      TEXT NOT NULL,              -- 'conversion', 'click', 'purchase'
  user_id         UUID,
  anonymous_id    TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exp_events_experiment ON experiment_events (experiment_id, variant_id, event_type);

-- RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_events ENABLE ROW LEVEL SECURITY;
-- Service role only (admin manages experiments)

-- ── RPC: assign_experiment ───────────────────────────────────────────────────
-- Consistent assignment using hash of user_id + experiment_key

CREATE OR REPLACE FUNCTION assign_experiment(
  p_experiment_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id TEXT DEFAULT NULL
)
RETURNS TEXT -- returns variant_id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_experiment experiments%ROWTYPE;
  v_existing TEXT;
  v_variants JSONB;
  v_hash INT;
  v_seed TEXT;
  v_cumulative_weight INT := 0;
  v_total_weight INT := 0;
  v_variant JSONB;
  v_assigned_variant TEXT;
BEGIN
  -- Find active experiment
  SELECT * INTO v_experiment FROM experiments WHERE key = p_experiment_key AND status = 'active';
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Check existing assignment
  IF p_user_id IS NOT NULL THEN
    SELECT variant_id INTO v_existing
    FROM experiment_assignments
    WHERE experiment_id = v_experiment.id AND user_id = p_user_id;
    IF FOUND THEN RETURN v_existing; END IF;
  ELSIF p_anonymous_id IS NOT NULL THEN
    SELECT variant_id INTO v_existing
    FROM experiment_assignments
    WHERE experiment_id = v_experiment.id AND anonymous_id = p_anonymous_id;
    IF FOUND THEN RETURN v_existing; END IF;
  ELSE
    RETURN NULL;
  END IF;

  -- Calculate assignment using deterministic hash
  v_seed := v_experiment.key || ':' || COALESCE(p_user_id::TEXT, p_anonymous_id, '');
  v_hash := ABS(hashtext(v_seed)) % 100;
  v_variants := v_experiment.variants;

  -- Calculate total weight
  FOR v_variant IN SELECT * FROM jsonb_array_elements(v_variants)
  LOOP
    v_total_weight := v_total_weight + (v_variant->>'weight')::INT;
  END LOOP;

  -- Find variant by weight
  FOR v_variant IN SELECT * FROM jsonb_array_elements(v_variants)
  LOOP
    v_cumulative_weight := v_cumulative_weight + ((v_variant->>'weight')::INT * 100 / v_total_weight);
    IF v_hash < v_cumulative_weight THEN
      v_assigned_variant := v_variant->>'id';
      EXIT;
    END IF;
  END LOOP;

  -- Fallback to last variant
  IF v_assigned_variant IS NULL THEN
    v_assigned_variant := (v_variants->(jsonb_array_length(v_variants) - 1))->>'id';
  END IF;

  -- Insert assignment
  INSERT INTO experiment_assignments (experiment_id, user_id, anonymous_id, variant_id)
  VALUES (v_experiment.id, p_user_id, p_anonymous_id, v_assigned_variant)
  ON CONFLICT DO NOTHING;

  RETURN v_assigned_variant;
END;
$$;

GRANT EXECUTE ON FUNCTION assign_experiment TO service_role;
