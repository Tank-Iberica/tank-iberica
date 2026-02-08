-- ============================================
-- Migration 00006: News table
-- ============================================

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_es TEXT NOT NULL,
  title_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  content_es TEXT NOT NULL,
  content_en TEXT,
  hashtags TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_news_category ON news(category);

-- Updated_at trigger (reuses function from 00002)
CREATE TRIGGER set_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Public: read published news
CREATE POLICY "news_select_published"
  ON news FOR SELECT
  USING (status = 'published');

-- Admin: per-operation policies using auth.users (avoids RLS recursion)
-- Note: no admin SELECT policy needed — published policy covers public reads,
-- admin reads all statuses via future admin-specific endpoint if needed.

CREATE POLICY "news_admin_insert"
  ON news FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "news_admin_update"
  ON news FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "news_admin_delete"
  ON news FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- Seed data: 3 example news articles
INSERT INTO news (title_es, title_en, slug, category, content_es, content_en, hashtags, status, published_at, image_url) VALUES
(
  'Normativa Euro 7: lo que necesitas saber',
  'Euro 7 Regulation: what you need to know',
  'normativa-euro-7',
  'prensa',
  'La nueva normativa Euro 7 entra en vigor en 2025 y afecta a todos los vehículos industriales nuevos. Los límites de emisiones se endurecen significativamente, lo que supone un reto para fabricantes y operadores de flotas. En este artículo repasamos los puntos clave de la regulación y cómo prepararse para cumplir con los nuevos requisitos.',
  'The new Euro 7 regulation comes into effect in 2025 and affects all new industrial vehicles. Emission limits are significantly tightened, posing a challenge for manufacturers and fleet operators. In this article we review the key points of the regulation and how to prepare to meet the new requirements.',
  ARRAY['euro7', 'normativa', 'emisiones'],
  'published',
  now() - interval '3 days',
  NULL
),
(
  'Tank Iberica participa en la Feria Internacional de Transporte',
  'Tank Iberica participates in the International Transport Fair',
  'feria-transporte-2026',
  'eventos',
  'Tank Iberica estará presente en la próxima edición de la Feria Internacional de Transporte que se celebrará en Madrid del 15 al 18 de marzo. Visitenos en el stand B-42 para conocer nuestra flota de vehículos industriales y las últimas novedades en alquiler y venta.',
  'Tank Iberica will be present at the next edition of the International Transport Fair to be held in Madrid from March 15 to 18. Visit us at stand B-42 to learn about our fleet of industrial vehicles and the latest news in rental and sales.',
  ARRAY['feria', 'transporte', 'madrid'],
  'published',
  now() - interval '1 day',
  NULL
),
(
  'Nuevos modelos de semirremolques disponibles en alquiler',
  'New semi-trailer models available for rental',
  'nuevos-semirremolques-alquiler',
  'destacados',
  'Ampliamos nuestra flota con los últimos modelos de semirremolques frigoríficos y de lona. Disponibles para alquiler a corto y largo plazo con mantenimiento incluido. Consulte disponibilidad y tarifas contactando con nuestro equipo comercial.',
  'We expand our fleet with the latest models of refrigerated and curtain-side semi-trailers. Available for short and long-term rental with maintenance included. Check availability and rates by contacting our sales team.',
  ARRAY['semirremolques', 'alquiler', 'flota'],
  'published',
  now(),
  NULL
);
