-- Add applicable_filters column to subcategories
-- This stores which filters are active for each subcategory (legacy feature)

ALTER TABLE subcategories
ADD COLUMN IF NOT EXISTS applicable_filters UUID[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN subcategories.applicable_filters IS 'Array of filter_definitions IDs that apply to this subcategory';
