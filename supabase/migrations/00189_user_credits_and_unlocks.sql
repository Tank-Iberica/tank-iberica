-- Migration 00117: user_credits, credit_transactions, vehicle_unlocks
-- Agent A — Task #9 (vehicle early-access unlock system)

-- ── user_credits ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id       uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance       integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased integer NOT NULL DEFAULT 0 CHECK (total_purchased >= 0),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own credit balance
DROP POLICY IF EXISTS "user_credits_select_own" ON public.user_credits;
CREATE POLICY "user_credits_select_own"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_credits_update_own" ON public.user_credits;
CREATE POLICY "user_credits_update_own"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── credit_transactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text    NOT NULL CHECK (type IN ('purchase', 'spend', 'refund')),
  credits       integer NOT NULL,          -- positive = in, negative = out
  balance_after integer NOT NULL,
  pack_id       uuid    REFERENCES public.credit_packs(id),
  vehicle_id    uuid    REFERENCES public.vehicles(id),
  reference     text,                       -- Stripe session ID or other ref
  description   text,
  metadata      jsonb   NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
DROP POLICY IF EXISTS "credit_transactions_select_own" ON public.credit_transactions;
CREATE POLICY "credit_transactions_select_own"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ── vehicle_unlocks ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicle_unlocks (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id    uuid    NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  credits_spent integer NOT NULL DEFAULT 1 CHECK (credits_spent > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

ALTER TABLE public.vehicle_unlocks ENABLE ROW LEVEL SECURITY;

-- Users can read their own unlocks
DROP POLICY IF EXISTS "vehicle_unlocks_select_own" ON public.vehicle_unlocks;
CREATE POLICY "vehicle_unlocks_select_own"
  ON public.vehicle_unlocks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own unlocks (server-side validation enforces balance)
DROP POLICY IF EXISTS "vehicle_unlocks_insert_own" ON public.vehicle_unlocks;
CREATE POLICY "vehicle_unlocks_insert_own"
  ON public.vehicle_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_unlocks_user_id ON public.vehicle_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_unlocks_vehicle_id ON public.vehicle_unlocks(vehicle_id);
