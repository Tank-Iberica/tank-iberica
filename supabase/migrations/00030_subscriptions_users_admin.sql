-- ================================================
-- 00030: Ensure subscriptions table exists + RLS for admin management
-- ================================================

-- ================================================
-- Subscriptions table (may already exist in remote)
-- ================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  pref_web BOOLEAN DEFAULT false,
  pref_press BOOLEAN DEFAULT false,
  pref_newsletter BOOLEAN DEFAULT false,
  pref_featured BOOLEAN DEFAULT false,
  pref_events BOOLEAN DEFAULT false,
  pref_csr BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Anyone can subscribe (public insert)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_public_insert') THEN
    CREATE POLICY "subscriptions_public_insert" ON subscriptions FOR INSERT WITH CHECK (true);
  END IF;

  -- Users can read their own subscription by email
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_own_select') THEN
    CREATE POLICY "subscriptions_own_select" ON subscriptions FOR SELECT USING (
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
    );
  END IF;

  -- Users can update their own subscription
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_own_update') THEN
    CREATE POLICY "subscriptions_own_update" ON subscriptions FOR UPDATE USING (
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
    );
  END IF;

  -- Admin can delete subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_admin_delete') THEN
    CREATE POLICY "subscriptions_admin_delete" ON subscriptions FOR DELETE USING (
      auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
    );
  END IF;
END $$;
