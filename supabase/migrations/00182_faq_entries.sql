-- Migration: FAQ entries for dynamic customer support page (F55)
-- Stores FAQ entries by category with i18n support (JSONB).

CREATE TABLE IF NOT EXISTS faq_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    VARCHAR(100) NOT NULL,
  question    JSONB NOT NULL DEFAULT '{}'::JSONB,
  answer      JSONB NOT NULL DEFAULT '{}'::JSONB,
  sort_order  INT NOT NULL DEFAULT 0,
  published   BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faq_entries_category
  ON faq_entries (category, sort_order)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_faq_entries_published
  ON faq_entries (published, sort_order);

-- Updated at trigger
CREATE OR REPLACE TRIGGER set_updated_at_faq_entries
  BEFORE UPDATE ON faq_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read published FAQs
CREATE POLICY faq_entries_public_read ON faq_entries
  FOR SELECT
  USING (published = true);

-- Admins can do everything
CREATE POLICY faq_entries_admin_all ON faq_entries
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

COMMENT ON TABLE faq_entries IS 'FAQ entries for customer support page. question/answer are JSONB for i18n (es/en keys).';

-- Seed initial FAQ categories (as example data)
INSERT INTO faq_entries (category, question, answer, sort_order, published) VALUES
  ('cuenta', '{"es": "¿Cómo creo una cuenta?", "en": "How do I create an account?"}', '{"es": "Haz clic en Registrarse y sigue los pasos.", "en": "Click Sign Up and follow the steps."}', 1, true),
  ('cuenta', '{"es": "¿Cómo cambio mi contraseña?", "en": "How do I change my password?"}', '{"es": "Ve a Perfil > Seguridad > Cambiar contraseña.", "en": "Go to Profile > Security > Change password."}', 2, true),
  ('pagos', '{"es": "¿Qué métodos de pago aceptan?", "en": "What payment methods do you accept?"}', '{"es": "Aceptamos tarjeta de crédito/débito y transferencia bancaria.", "en": "We accept credit/debit cards and bank transfers."}', 1, true),
  ('publicar', '{"es": "¿Cómo publico un vehículo?", "en": "How do I list a vehicle?"}', '{"es": "Accede a tu panel de dealer y haz clic en Publicar vehículo.", "en": "Go to your dealer dashboard and click List vehicle."}', 1, true),
  ('tecnico', '{"es": "¿Qué navegadores son compatibles?", "en": "What browsers are supported?"}', '{"es": "Chrome, Firefox, Safari y Edge en sus últimas versiones.", "en": "Chrome, Firefox, Safari and Edge in their latest versions."}', 1, true);
