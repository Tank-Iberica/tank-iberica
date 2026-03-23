-- Migration: error_events table
-- Used by: server/api/infra/error-rate.get.ts

CREATE TABLE IF NOT EXISTS public.error_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint text,
  status_code smallint,
  error_message text,
  stack_trace text,
  vertical text DEFAULT 'tracciona',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_error_events_created ON public.error_events(created_at DESC);
CREATE INDEX idx_error_events_status_code ON public.error_events(status_code);

-- RLS
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert/read (server-side only)
CREATE POLICY "Service role full access"
  ON public.error_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can read error events"
  ON public.error_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
