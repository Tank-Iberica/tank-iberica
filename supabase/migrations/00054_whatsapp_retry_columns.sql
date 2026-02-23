-- Add retry tracking columns to whatsapp_submissions
ALTER TABLE whatsapp_submissions ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE whatsapp_submissions ADD COLUMN IF NOT EXISTS last_error TEXT;
