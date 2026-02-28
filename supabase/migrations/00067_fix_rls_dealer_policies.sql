-- Migration 00067: Fix incorrect RLS policies from migration 00065
--
-- Problem: migration 00065 was applied with `dealer_id = auth.uid()` policies,
-- but dealer_id is the dealer's UUID (from dealers table), NOT the user's UUID.
-- Dealers could not access their own records.
--
-- Fix: replace direct comparison with subquery lookup through dealers table.
-- Affected tables: historico, pipeline_items, dealer_contracts, dealer_platforms,
--                  dealer_quotes, maintenance_records, rental_records, competitor_vehicles

-- ============================================================================
-- historico
-- ============================================================================
DROP POLICY IF EXISTS "Dealers manage own historico" ON public.historico;

CREATE POLICY "Dealers manage own historico" ON public.historico
  FOR ALL
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- ============================================================================
-- pipeline_items
-- ============================================================================
DROP POLICY IF EXISTS "Dealers manage own pipeline" ON public.pipeline_items;

CREATE POLICY "Dealers manage own pipeline" ON public.pipeline_items
  FOR ALL
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- ============================================================================
-- dealer_contracts
-- ============================================================================
DROP POLICY IF EXISTS "Dealers manage own contracts" ON public.dealer_contracts;

CREATE POLICY "Dealers manage own contracts" ON public.dealer_contracts
  FOR ALL
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- ============================================================================
-- dealer_platforms
-- ============================================================================
DROP POLICY IF EXISTS "Dealers manage own platforms" ON public.dealer_platforms;

CREATE POLICY "Dealers manage own platforms" ON public.dealer_platforms
  FOR ALL
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- ============================================================================
-- dealer_quotes
-- ============================================================================
DROP POLICY IF EXISTS "Dealers manage own quotes" ON public.dealer_quotes;

CREATE POLICY "Dealers manage own quotes" ON public.dealer_quotes
  FOR ALL
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- ============================================================================
-- maintenance_records
-- ============================================================================
DROP POLICY IF EXISTS "Dealers manage own maintenance" ON public.maintenance_records;

CREATE POLICY "Dealers manage own maintenance" ON public.maintenance_records
  FOR ALL
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- ============================================================================
-- rental_records
-- ============================================================================
DROP POLICY IF EXISTS "Dealers manage own rentals" ON public.rental_records;

CREATE POLICY "Dealers manage own rentals" ON public.rental_records
  FOR ALL
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- ============================================================================
-- competitor_vehicles (SELECT only — dealer sees their own scraped data)
-- ============================================================================
DROP POLICY IF EXISTS "Dealers read own competitor data" ON public.competitor_vehicles;

CREATE POLICY "Dealers read own competitor data" ON public.competitor_vehicles
  FOR SELECT
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));
