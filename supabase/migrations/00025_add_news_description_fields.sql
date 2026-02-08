-- Add dedicated meta description fields to news table
-- These serve as the <meta name="description"> tag for SEO
ALTER TABLE news ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS description_en TEXT;
