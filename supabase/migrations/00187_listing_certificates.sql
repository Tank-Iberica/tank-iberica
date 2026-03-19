-- 00145_listing_certificates.sql
-- Certificate table for listing publication certificates (credit-gated feature #26)

CREATE TABLE IF NOT EXISTS listing_certificates (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id       UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_code TEXT        NOT NULL UNIQUE DEFAULT substring(md5(random()::text || now()::text), 1, 16),
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  credits_spent    INTEGER     NOT NULL DEFAULT 1,
  metadata         JSONB       DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_certificates_vehicle_id_idx ON listing_certificates(vehicle_id);
CREATE INDEX IF NOT EXISTS listing_certificates_user_id_idx ON listing_certificates(user_id);
CREATE INDEX IF NOT EXISTS listing_certificates_code_idx ON listing_certificates(certificate_code);

ALTER TABLE listing_certificates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON listing_certificates;
CREATE POLICY "Users can view own certificates"
  ON listing_certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all certificates
DROP POLICY IF EXISTS "Admins can manage certificates" ON listing_certificates;
CREATE POLICY "Admins can manage certificates"
  ON listing_certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role' = 'admin' OR u.raw_user_meta_data->>'role' = 'superadmin')
    )
  );
