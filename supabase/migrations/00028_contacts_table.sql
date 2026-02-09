-- ================================================
-- 00028: Contacts table (Agenda de proveedores/clientes)
-- Admin-only table for managing external business contacts
-- ================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type TEXT NOT NULL DEFAULT 'client',  -- 'provider' | 'client' | 'other'
  company TEXT,
  contact_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  location TEXT,
  products TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);

-- Auto-update trigger
CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- RLS: Admin only
-- ================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_admin_select" ON contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "contacts_admin_insert" ON contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "contacts_admin_update" ON contacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "contacts_admin_delete" ON contacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));
