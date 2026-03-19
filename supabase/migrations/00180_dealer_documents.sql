-- Migration: Create dealer_documents table for admin document registry (F39)
-- Stores invoices, contracts, certificates per dealer with metadata.

-- Document type enum
DO $$ BEGIN
  CREATE TYPE dealer_document_type AS ENUM (
    'invoice',
    'contract',
    'certificate',
    'insurance',
    'license',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Document status enum
DO $$ BEGIN
  CREATE TYPE dealer_document_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Main table
CREATE TABLE IF NOT EXISTS dealer_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id       UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  type            dealer_document_type NOT NULL DEFAULT 'other',
  status          dealer_document_status NOT NULL DEFAULT 'pending',
  title           TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type       VARCHAR(128),
  metadata        JSONB DEFAULT '{}'::JSONB,
  notes           TEXT,
  uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dealer_documents_dealer
  ON dealer_documents (dealer_id, type);

CREATE INDEX IF NOT EXISTS idx_dealer_documents_status
  ON dealer_documents (status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_dealer_documents_expires
  ON dealer_documents (expires_at)
  WHERE expires_at IS NOT NULL;

-- Updated at trigger (use update_updated_at which exists in this schema)
DROP TRIGGER IF EXISTS set_updated_at_dealer_documents ON dealer_documents;
CREATE TRIGGER set_updated_at_dealer_documents
  BEFORE UPDATE ON dealer_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE dealer_documents ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS dealer_documents_admin_all ON dealer_documents;
CREATE POLICY dealer_documents_admin_all ON dealer_documents
  FOR ALL
  USING (is_admin());

-- Dealers can read their own documents
DROP POLICY IF EXISTS dealer_documents_dealer_read ON dealer_documents;
CREATE POLICY dealer_documents_dealer_read ON dealer_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dealers
      WHERE dealers.user_id = auth.uid()
        AND dealers.id = dealer_documents.dealer_id
    )
  );

COMMENT ON TABLE dealer_documents IS 'Documents associated with dealers: invoices, contracts, certificates, etc.';
