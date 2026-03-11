-- Glossary table for industry terminology
-- Supports multi-language via JSONB fields and vertical isolation

CREATE TABLE IF NOT EXISTS public.glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL DEFAULT 'tracciona',
  term JSONB NOT NULL DEFAULT '{}',        -- {"es": "Excavadora", "en": "Excavator"}
  slug TEXT NOT NULL,                       -- URL-friendly term (e.g. "excavadora")
  definition JSONB NOT NULL DEFAULT '{}',  -- {"es": "Máquina pesada...", "en": "Heavy machine..."}
  category TEXT,                           -- Optional grouping (e.g. "maquinaria", "financiacion")
  related_terms TEXT[] DEFAULT '{}',       -- Array of related slugs
  see_also UUID[],                         -- Array of glossary IDs for cross-reference
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vertical, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_glossary_vertical ON public.glossary (vertical);
CREATE INDEX IF NOT EXISTS idx_glossary_slug ON public.glossary (slug);
CREATE INDEX IF NOT EXISTS idx_glossary_category ON public.glossary (category);
CREATE INDEX IF NOT EXISTS idx_glossary_status ON public.glossary (status);

-- Full-text search on term (Spanish)
CREATE INDEX IF NOT EXISTS idx_glossary_term_search
  ON public.glossary USING gin (term jsonb_path_ops);

-- RLS
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

-- Public read access for published terms
CREATE POLICY glossary_select_published ON public.glossary
  FOR SELECT USING (status = 'published');

-- Admin full access
CREATE POLICY glossary_admin_all ON public.glossary
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_glossary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_glossary_updated_at
  BEFORE UPDATE ON public.glossary
  FOR EACH ROW EXECUTE FUNCTION update_glossary_updated_at();

COMMENT ON TABLE public.glossary IS 'Industry glossary with multi-language terms and definitions. Vertical-scoped.';
