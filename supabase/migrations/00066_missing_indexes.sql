-- Migration 00066: Add missing performance indexes
-- Improves performance for vehicle filtering by category and auction bid lookups

-- Index for vehicles filtered by category_id (commonly used in catalog/filter queries)
CREATE INDEX IF NOT EXISTS idx_vehicles_category_id ON public.vehicles(category_id);

-- Index for auction_bids filtered by auction_id (lookups during auction management)
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON public.auction_bids(auction_id);
