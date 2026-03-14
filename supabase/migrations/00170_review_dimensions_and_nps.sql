-- ============================================================
-- Migration 00170: Add review dimensions (JSONB) and NPS score
-- Backlog #52 — Reviews with 4 dimension scores
-- Backlog #53 — NPS 0-10 field
-- ============================================================

-- Add dimensions JSONB column for detailed scoring
-- Expected shape: { "communication": 4, "accuracy": 5, "condition": 3, "logistics": 4 }
ALTER TABLE dealer_reviews
  ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT NULL;

-- Add NPS score (0-10 scale, Net Promoter Score)
ALTER TABLE dealer_reviews
  ADD COLUMN IF NOT EXISTS nps_score SMALLINT DEFAULT NULL CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10));

-- Add constraint to validate dimension values are 1-5
ALTER TABLE dealer_reviews
  ADD CONSTRAINT check_dimension_values CHECK (
    dimensions IS NULL
    OR (
      (dimensions->>'communication')::int BETWEEN 1 AND 5
      AND (dimensions->>'accuracy')::int BETWEEN 1 AND 5
      AND (dimensions->>'condition')::int BETWEEN 1 AND 5
      AND (dimensions->>'logistics')::int BETWEEN 1 AND 5
    )
  );

-- Update the rating summary function to include dimensions and NPS
CREATE OR REPLACE FUNCTION get_dealer_rating_summary(p_dealer_id UUID)
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
  FROM dealer_reviews
  WHERE dealer_id = p_dealer_id
    AND status = 'approved';
$$;

-- Index for efficient NPS aggregation queries
CREATE INDEX IF NOT EXISTS idx_dealer_reviews_nps
  ON dealer_reviews(dealer_id, nps_score)
  WHERE status = 'approved' AND nps_score IS NOT NULL;
