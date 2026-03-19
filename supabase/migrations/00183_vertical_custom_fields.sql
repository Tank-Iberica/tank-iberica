-- Migration: Custom fields JSONB per vertical (F51)
-- Allows defining dynamic fields per vertical without new migrations.

-- Field type enum
DO $$ BEGIN
  CREATE TYPE custom_field_type AS ENUM (
    'text',
    'number',
    'boolean',
    'select',
    'date',
    'url'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Entity type enum (what entity the field applies to)
DO $$ BEGIN
  CREATE TYPE custom_field_entity AS ENUM (
    'vehicle',
    'dealer',
    'article'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Custom field definitions table
CREATE TABLE IF NOT EXISTS vertical_custom_fields (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical      VARCHAR(64) NOT NULL,
  entity_type   custom_field_entity NOT NULL DEFAULT 'vehicle',
  field_name    VARCHAR(100) NOT NULL,
  field_type    custom_field_type NOT NULL DEFAULT 'text',
  label         JSONB NOT NULL DEFAULT '{}'::JSONB,
  placeholder   JSONB DEFAULT '{}'::JSONB,
  validation    JSONB DEFAULT '{}'::JSONB,
  options       JSONB DEFAULT '[]'::JSONB,
  sort_order    INT NOT NULL DEFAULT 0,
  required      BOOLEAN NOT NULL DEFAULT false,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vcf_unique_field UNIQUE (vertical, entity_type, field_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vcf_vertical_entity
  ON vertical_custom_fields (vertical, entity_type, sort_order)
  WHERE active = true;

-- Add custom_data JSONB column to vehicles if not exists
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::JSONB;

-- Updated at trigger
CREATE OR REPLACE TRIGGER set_updated_at_vertical_custom_fields
  BEFORE UPDATE ON vertical_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE vertical_custom_fields ENABLE ROW LEVEL SECURITY;

-- Anyone can read active field definitions
CREATE POLICY vcf_public_read ON vertical_custom_fields
  FOR SELECT
  USING (active = true);

-- Admins can manage field definitions
CREATE POLICY vcf_admin_all ON vertical_custom_fields
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

COMMENT ON TABLE vertical_custom_fields IS 'Dynamic field definitions per vertical. label/placeholder are JSONB for i18n.';
COMMENT ON COLUMN vehicles.custom_data IS 'Dynamic custom field values as JSONB. Keys match vertical_custom_fields.field_name.';
