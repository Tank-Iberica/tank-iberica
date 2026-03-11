-- ============================================================
-- Migration 00083: Dealer reviews and ratings
-- Allows authenticated buyers to rate and review dealers.
-- Reviews require admin moderation before becoming public.
-- ============================================================

CREATE TABLE dealer_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id    UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  reviewer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  status       VARCHAR NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One review per buyer per dealer
  UNIQUE (dealer_id, reviewer_id)
);

CREATE INDEX idx_dealer_reviews_dealer   ON dealer_reviews(dealer_id, status);
CREATE INDEX idx_dealer_reviews_reviewer ON dealer_reviews(reviewer_id);
CREATE INDEX idx_dealer_reviews_status   ON dealer_reviews(status, created_at DESC);

CREATE TRIGGER set_updated_at_dealer_reviews
  BEFORE UPDATE ON dealer_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE dealer_reviews ENABLE ROW LEVEL SECURITY;

-- Public: read approved reviews only
CREATE POLICY "dealer_reviews_public_read" ON dealer_reviews
  FOR SELECT USING (status = 'approved');

-- Authenticated users: insert their own review
CREATE POLICY "dealer_reviews_authenticated_insert" ON dealer_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND reviewer_id = auth.uid());

-- Reviewers: update or delete their own pending review only
CREATE POLICY "dealer_reviews_own_update" ON dealer_reviews
  FOR UPDATE USING (reviewer_id = auth.uid() AND status = 'pending');

CREATE POLICY "dealer_reviews_own_delete" ON dealer_reviews
  FOR DELETE USING (reviewer_id = auth.uid() AND status = 'pending');

-- Admin: full access
CREATE POLICY "dealer_reviews_admin_all" ON dealer_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Materialized summary per dealer (refreshed by admin or cron)
-- ============================================================
CREATE OR REPLACE FUNCTION get_dealer_rating_summary(p_dealer_id UUID)
RETURNS TABLE(average_rating NUMERIC, review_count BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ROUND(AVG(rating)::NUMERIC, 1) AS average_rating,
    COUNT(*)                        AS review_count
  FROM dealer_reviews
  WHERE dealer_id = p_dealer_id
    AND status = 'approved';
$$;
