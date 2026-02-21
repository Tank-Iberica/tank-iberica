-- 00046: DSA compliance — reports table for content flagging
-- Required by Digital Services Act (EU) and UK Online Safety Act

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_email TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vehicle', 'dealer', 'article', 'comment')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'illegal_content', 'fraud_scam', 'misleading_info', 'stolen_vehicle',
    'counterfeit', 'hate_speech', 'spam', 'privacy_violation', 'other'
  )),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved_removed', 'resolved_kept')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON public.reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a report (DSA requires accessible reporting)
CREATE POLICY "Anyone can submit reports"
  ON public.reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read reports
CREATE POLICY "Admins can read reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Only admins can update reports
CREATE POLICY "Admins can update reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );
