-- ==========================================================
-- Migration 00033: Landing intro text generation function
-- ==========================================================
-- Provides a SQL function to auto-generate intro_text for
-- active_landings based on real catalog data (vehicle count,
-- price range, available brands).
-- Called by the recalculation job when updating landings.
-- ==========================================================

CREATE OR REPLACE FUNCTION generate_landing_intro(
  p_landing_id UUID,
  p_locale VARCHAR DEFAULT 'es'
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_landing RECORD;
  v_count INT;
  v_min_price NUMERIC;
  v_max_price NUMERIC;
  v_brands TEXT;
  v_result TEXT;
BEGIN
  -- Get the landing
  SELECT * INTO v_landing FROM active_landings WHERE id = p_landing_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Count vehicles matching this landing's dimensions
  SELECT
    COUNT(*),
    MIN(v.price),
    MAX(v.price)
  INTO v_count, v_min_price, v_max_price
  FROM vehicles v
  WHERE v.status = 'published'
    AND (
      v.category_id = ANY(v_landing.dimension_values)
      OR v.action_id = ANY(v_landing.dimension_values)
      OR v.brand_id = ANY(v_landing.dimension_values)
    );

  -- Get distinct brands
  SELECT string_agg(DISTINCT b.name, ', ' ORDER BY b.name)
  INTO v_brands
  FROM vehicles v
  JOIN brands b ON b.id = v.brand_id
  WHERE v.status = 'published'
    AND (
      v.category_id = ANY(v_landing.dimension_values)
      OR v.action_id = ANY(v_landing.dimension_values)
      OR v.brand_id = ANY(v_landing.dimension_values)
    );

  -- Generate text based on locale
  IF p_locale = 'en' THEN
    v_result := 'Currently we have ' || v_count || ' vehicles available';
    IF v_min_price IS NOT NULL AND v_max_price IS NOT NULL AND v_min_price != v_max_price THEN
      v_result := v_result || ', from €' || v_min_price::TEXT || ' to €' || v_max_price::TEXT;
    END IF;
    v_result := v_result || '.';
    IF v_brands IS NOT NULL AND v_brands != '' THEN
      v_result := v_result || ' Available brands: ' || v_brands || '.';
    END IF;
  ELSE
    v_result := 'Actualmente disponemos de ' || v_count || ' vehículos disponibles';
    IF v_min_price IS NOT NULL AND v_max_price IS NOT NULL AND v_min_price != v_max_price THEN
      v_result := v_result || ', desde ' || v_min_price::TEXT || '€ hasta ' || v_max_price::TEXT || '€';
    END IF;
    v_result := v_result || '.';
    IF v_brands IS NOT NULL AND v_brands != '' THEN
      v_result := v_result || ' Marcas disponibles: ' || v_brands || '.';
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users (for admin recalculation)
GRANT EXECUTE ON FUNCTION generate_landing_intro(UUID, VARCHAR) TO authenticated;
