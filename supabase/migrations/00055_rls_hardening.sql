-- Session 35: RLS Hardening
-- Addresses critical gaps found in security audit

-- 1. Create reusable is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. advertisements: replace public INSERT with authenticated-only
DROP POLICY IF EXISTS "advertisements_public_insert" ON public.advertisements;
DROP POLICY IF EXISTS "advertisements_anyone_insert" ON public.advertisements;
DROP POLICY IF EXISTS "advertisements_insert" ON public.advertisements;
CREATE POLICY "advertisements_authenticated_insert" ON public.advertisements
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. demands: replace public INSERT with authenticated-only
DROP POLICY IF EXISTS "demands_public_insert" ON public.demands;
DROP POLICY IF EXISTS "demands_anyone_insert" ON public.demands;
DROP POLICY IF EXISTS "demands_insert" ON public.demands;
CREATE POLICY "demands_authenticated_insert" ON public.demands
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. payments: add INSERT policy
DROP POLICY IF EXISTS "payments_user_insert" ON public.payments;
CREATE POLICY "payments_user_insert" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. auction_bids: add UPDATE/DELETE for own bids
DROP POLICY IF EXISTS "auction_bids_own_update" ON public.auction_bids;
CREATE POLICY "auction_bids_own_update" ON public.auction_bids
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "auction_bids_own_delete" ON public.auction_bids;
CREATE POLICY "auction_bids_own_delete" ON public.auction_bids
  FOR DELETE USING (user_id = auth.uid());

-- 6. auction_registrations: add UPDATE for own registrations
DROP POLICY IF EXISTS "auction_registrations_own_update" ON public.auction_registrations;
CREATE POLICY "auction_registrations_own_update" ON public.auction_registrations
  FOR UPDATE USING (user_id = auth.uid());

-- 7. saved_searches: add UPDATE/DELETE for own searches
DROP POLICY IF EXISTS "saved_searches_own_update" ON public.saved_searches;
CREATE POLICY "saved_searches_own_update" ON public.saved_searches
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_searches_own_delete" ON public.saved_searches;
CREATE POLICY "saved_searches_own_delete" ON public.saved_searches
  FOR DELETE USING (user_id = auth.uid());
