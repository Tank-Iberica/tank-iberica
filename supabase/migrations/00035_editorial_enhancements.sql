-- ==========================================================
-- Migration 00035: Editorial enhancements + comments table
-- ==========================================================
-- Adds article-level fields to news table for full editorial
-- system (FAQ schema, excerpts, scheduling, social posts).
-- Creates comments table for article comment moderation.
-- ==========================================================

-- =====================
-- A. NEWS TABLE ENHANCEMENTS
-- =====================

-- Section type (guia vs noticias)
ALTER TABLE news ADD COLUMN IF NOT EXISTS section VARCHAR DEFAULT 'noticias';

-- FAQ schema for featured snippets
ALTER TABLE news ADD COLUMN IF NOT EXISTS faq_schema JSONB;

-- Excerpt for index pages and social sharing
ALTER TABLE news ADD COLUMN IF NOT EXISTS excerpt_es TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS excerpt_en TEXT;

-- Scheduling
ALTER TABLE news ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Social media post texts
ALTER TABLE news ADD COLUMN IF NOT EXISTS social_post_text JSONB DEFAULT '{}';
ALTER TABLE news ADD COLUMN IF NOT EXISTS social_posted BOOLEAN DEFAULT false;
ALTER TABLE news ADD COLUMN IF NOT EXISTS social_scheduled_at TIMESTAMPTZ;

-- SEO and metrics
ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_score INT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS reading_time_minutes INT;

-- Target markets
ALTER TABLE news ADD COLUMN IF NOT EXISTS target_markets TEXT[] DEFAULT '{all}';

-- Translation tracking
ALTER TABLE news ADD COLUMN IF NOT EXISTS pending_translations BOOLEAN DEFAULT false;

-- Expiry for temporal content
ALTER TABLE news ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Related categories for internal linking
ALTER TABLE news ADD COLUMN IF NOT EXISTS related_categories TEXT[];

-- Index for scheduled publishing cron
CREATE INDEX IF NOT EXISTS idx_news_scheduled ON news(status, scheduled_at) WHERE status = 'scheduled';

-- Index for section filtering
CREATE INDEX IF NOT EXISTS idx_news_section ON news(section, status, published_at DESC);


-- =====================
-- B. COMMENTS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  article_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  author_name VARCHAR,
  author_email VARCHAR,
  content TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'spam', 'rejected'
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(vertical, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Public can read approved comments
CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (
  status = 'approved'
);

-- Authenticated users can create comments
CREATE POLICY "comments_auth_insert" ON comments FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Users can edit their own pending comments
CREATE POLICY "comments_own_update" ON comments FOR UPDATE USING (
  auth.uid() = user_id AND status = 'pending'
);

-- Admin has full access
CREATE POLICY "comments_admin_all" ON comments FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
