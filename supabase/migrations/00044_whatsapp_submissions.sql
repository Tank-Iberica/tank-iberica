-- WhatsApp Submissions table
-- Stores incoming vehicle submissions from WhatsApp Business API
-- Each submission tracks: dealer, media, text, processing status, and resulting vehicle

CREATE TABLE IF NOT EXISTS whatsapp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  media_ids TEXT[] DEFAULT '{}',
  text_content TEXT,
  status VARCHAR DEFAULT 'received',  -- 'received', 'processing', 'processed', 'failed', 'published'
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  error_message TEXT,
  claude_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_submissions_dealer ON whatsapp_submissions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_wa_submissions_status ON whatsapp_submissions(status);

ALTER TABLE whatsapp_submissions ENABLE ROW LEVEL SECURITY;

-- Admin only: full access
CREATE POLICY "wa_submissions_admin_all" ON whatsapp_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_wa_submissions
  BEFORE UPDATE ON whatsapp_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
