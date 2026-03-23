-- Migration: glossary table
-- Used by: app/composables/useGlossary.ts

CREATE TABLE IF NOT EXISTS public.glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  vertical text NOT NULL DEFAULT 'tracciona',
  term jsonb NOT NULL DEFAULT '{}'::jsonb,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text,
  related_terms text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT glossary_unique_slug_vertical UNIQUE (slug, vertical)
);

-- Indexes
CREATE INDEX idx_glossary_vertical_status ON public.glossary(vertical, status);
CREATE INDEX idx_glossary_slug ON public.glossary(slug);

-- RLS
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published glossary terms"
  ON public.glossary FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage glossary"
  ON public.glossary FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
