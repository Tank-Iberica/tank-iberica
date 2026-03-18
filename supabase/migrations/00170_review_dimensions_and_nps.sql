-- ============================================================
-- Migration 00170: Add review dimensions (JSONB) and NPS score
-- Backlog #52 — Reviews with 4 dimension scores
-- Backlog #53 — NPS 0-10 field
-- Target table: seller_reviews (used by /api/seller-reviews endpoints)
-- ============================================================

-- Add dimensions JSONB column for detailed scoring
-- Expected shape: { "communication": 4, "accuracy": 5, "condition": 3, "logistics": 4 }
ALTER TABLE seller_reviews
  ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT NULL;

-- Add NPS score (0-10 scale, Net Promoter Score)
ALTER TABLE seller_reviews
  ADD COLUMN IF NOT EXISTS nps_score SMALLINT DEFAULT NULL;

-- Add CHECK constraint for NPS range (0-10)
-- Using DO block to avoid error if constraint already exists
DO $$ BEGIN
  ALTER TABLE seller_reviews
    ADD CONSTRAINT seller_reviews_nps_range
    CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add CHECK constraint to validate dimension values are 1-5
DO $$ BEGIN
  ALTER TABLE seller_reviews
    ADD CONSTRAINT seller_reviews_dimension_values CHECK (
      dimensions IS NULL
      OR (
        (dimensions->>'communication')::int BETWEEN 1 AND 5
        AND (dimensions->>'accuracy')::int BETWEEN 1 AND 5
        AND (dimensions->>'condition')::int BETWEEN 1 AND 5
        AND (dimensions->>'logistics')::int BETWEEN 1 AND 5
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rating summary function for seller_reviews including dimensions and NPS
CREATE OR REPLACE FUNCTION get_seller_rating_summary(p_seller_id UUID)
RETURNS TABLE(
  average_rating NUMERIC,
  review_count BIGINT,
  avg_communication NUMERIC,
  avg_accuracy NUMERIC,
  avg_condition NUMERIC,
  avg_logistics NUMERIC,
  avg_nps NUMERIC,
  nps_promoters BIGINT,
  nps_detractors BIGINT,
  nps_score_net NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ROUND(AVG(rating)::NUMERIC, 1) AS average_rating,
    COUNT(*) AS review_count,
    ROUND(AVG((dimensions->>'communication')::NUMERIC), 1) AS avg_communication,
    ROUND(AVG((dimensions->>'accuracy')::NUMERIC), 1) AS avg_accuracy,
    ROUND(AVG((dimensions->>'condition')::NUMERIC), 1) AS avg_condition,
    ROUND(AVG((dimensions->>'logistics')::NUMERIC), 1) AS avg_logistics,
    ROUND(AVG(nps_score)::NUMERIC, 1) AS avg_nps,
    COUNT(*) FILTER (WHERE nps_score >= 9) AS nps_promoters,
    COUNT(*) FILTER (WHERE nps_score <= 6) AS nps_detractors,
    CASE
      WHEN COUNT(*) FILTER (WHERE nps_score IS NOT NULL) > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE nps_score >= 9)::NUMERIC / COUNT(*) FILTER (WHERE nps_score IS NOT NULL) * 100)
          - (COUNT(*) FILTER (WHERE nps_score <= 6)::NUMERIC / COUNT(*) FILTER (WHERE nps_score IS NOT NULL) * 100)
        , 1)
      ELSE NULL
    END AS nps_score_net
  FROM seller_reviews
  WHERE seller_id = p_seller_id
    AND status = 'published';
$$;

-- Index for efficient NPS aggregation queries
CREATE INDEX IF NOT EXISTS idx_seller_reviews_nps
  ON seller_reviews(seller_id, nps_score)
  WHERE status = 'published' AND nps_score IS NOT NULL;

-- Index for dimension-based queries
CREATE INDEX IF NOT EXISTS idx_seller_reviews_dimensions
  ON seller_reviews(seller_id)
  WHERE status = 'published' AND dimensions IS NOT NULL;
