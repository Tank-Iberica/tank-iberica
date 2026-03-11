-- Migration 00072: Compound performance indexes for high-traffic queries
-- Implements §7.3 of Plan Maestro 10/10 — DB optimizations for 10M users/month
--
-- Strategy:
--   1. Catalog queries always filter by status='published' first, then vertical, then category
--   2. Dealer queries always filter by dealer_id, then sort by created_at
--   3. Lead queries filter by dealer_id, sometimes status
--   4. Subscription queries filter by dealer_id + status
--   5. Put equality-predicate columns before range/sort columns in compound indexes

-- ============================================================
-- VEHICLES — Core catalog compound indexes
-- ============================================================

-- Most common catalog query: status + vertical + category (multi-vertical catalog)
-- Powers: useVehicles (main catalog), useVehicles.fetchCount, cron jobs
-- Previous: only (vertical, status) existed — no category in compound
CREATE INDEX IF NOT EXISTS idx_vehicles_status_vertical_category
  ON public.vehicles (status, vertical, category_id)
  WHERE status = 'published';

-- Dealer vehicles listing: status + dealer_id + creation date (for sorting)
-- Powers: useDealerDashboard, useAdminProductosPage, dealer portal
CREATE INDEX IF NOT EXISTS idx_vehicles_status_dealer_created
  ON public.vehicles (status, dealer_id, created_at DESC);

-- Price sort in catalog (WHERE status='published' ORDER BY price)
-- Powers: price_asc / price_desc sort options in useVehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_status_price
  ON public.vehicles (status, price)
  WHERE status = 'published';

-- Year sort in catalog (WHERE status='published' ORDER BY year)
-- Powers: year_asc / year_desc sort options in useVehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_status_year
  ON public.vehicles (status, year)
  WHERE status = 'published';

-- Featured + status for homepage (WHERE status='published' AND featured=true)
-- Powers: homepage featured section, useVehicles with filters.featured=true
CREATE INDEX IF NOT EXISTS idx_vehicles_status_featured
  ON public.vehicles (status, featured, created_at DESC)
  WHERE status = 'published' AND featured = true;

-- ============================================================
-- LEADS — Dealer CRM compound indexes
-- ============================================================

-- Dealer lead listing (ordered by date) — most common CRM query
-- Powers: useDealerDashboard, useDealerLeads, admin captacion
CREATE INDEX IF NOT EXISTS idx_leads_dealer_created
  ON public.leads (dealer_id, created_at DESC);

-- Dealer lead count by status — for response rate calculation
-- Powers: useDealerDashboard response rate calc, admin KPIs
CREATE INDEX IF NOT EXISTS idx_leads_dealer_status
  ON public.leads (dealer_id, status);

-- Lead count per vehicle (for analytics)
-- Powers: AdminDashboard vehicle lead counts, stats aggregations
CREATE INDEX IF NOT EXISTS idx_leads_vehicle_created
  ON public.leads (vehicle_id, created_at DESC);

-- ============================================================
-- SUBSCRIPTIONS — Dealer SaaS compound indexes
-- ============================================================

-- Dealer subscription lookup (most common: by dealer + active status)
-- Powers: useSubscriptionPlan, billing checks, feature flag gates
CREATE INDEX IF NOT EXISTS idx_subscriptions_dealer_status
  ON public.subscriptions (dealer_id, status);

-- Active subscriptions by vertical (for admin analytics)
-- Powers: useAdminDealerSuscripciones, admin dashboard KPIs
CREATE INDEX IF NOT EXISTS idx_subscriptions_vertical_status_created
  ON public.subscriptions (vertical, status, created_at DESC);

-- ============================================================
-- MARKET DATA — Analytics compound indexes
-- ============================================================

-- Market report primary query: by vertical + period (most recent first)
-- Powers: generateMarketReport service, /api/market-report
CREATE INDEX IF NOT EXISTS idx_market_data_vertical_period
  ON public.market_data (vertical, period DESC);

-- Market report subcategory aggregation: vertical + subcategory
-- Powers: buildSubcatTableRow in marketReport service
CREATE INDEX IF NOT EXISTS idx_market_data_vertical_subcategory
  ON public.market_data (vertical, subcategory, period DESC);

-- ============================================================
-- AUCTIONS — Live auction compound indexes
-- ============================================================

-- Active auctions by vertical + status (for auction list page)
-- Powers: useAuction, useAdminAuctionList
CREATE INDEX IF NOT EXISTS idx_auctions_vertical_status_ends
  ON public.auctions (vertical, status, ends_at ASC)
  WHERE status IN ('pending', 'active');

-- ============================================================
-- VEHICLES — Additional sort/filter combinations
-- ============================================================

-- Location province + status (geographic catalog filtering)
-- Improves on the single-column idx_vehicles_location_province
CREATE INDEX IF NOT EXISTS idx_vehicles_status_province
  ON public.vehicles (status, location_province)
  WHERE status = 'published';

-- Brand search + status (for filtering by brand in published vehicles)
CREATE INDEX IF NOT EXISTS idx_vehicles_status_brand
  ON public.vehicles (status, brand)
  WHERE status = 'published';
