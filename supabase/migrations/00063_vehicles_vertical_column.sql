-- =============================================================================
-- Migration 00063: Add vertical column to vehicles and advertisements
-- Enables multi-vertical isolation for these core tables
-- =============================================================================

-- Add vertical column to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical ON vehicles(vertical);
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical_status ON vehicles(vertical, status);

-- Add vertical column to advertisements
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';
CREATE INDEX IF NOT EXISTS idx_advertisements_vertical ON advertisements(vertical);

-- Update existing records (all current data is Tracciona)
UPDATE vehicles SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';
UPDATE advertisements SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';
