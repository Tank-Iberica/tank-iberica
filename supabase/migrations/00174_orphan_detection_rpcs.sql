-- Migration 00174: Orphan detection RPCs for orphan-cleanup cron (#388)

-- Count vehicles whose dealer_id references a non-existent dealer
CREATE OR REPLACE FUNCTION public.count_orphan_vehicles()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT count(*)
  FROM vehicles v
  LEFT JOIN dealers d ON d.id = v.dealer_id
  WHERE v.dealer_id IS NOT NULL
    AND d.id IS NULL;
$$;

-- Count leads whose vehicle_id references a non-existent vehicle
CREATE OR REPLACE FUNCTION public.count_orphan_leads()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT count(*)
  FROM leads l
  LEFT JOIN vehicles v ON v.id = l.vehicle_id
  WHERE l.vehicle_id IS NOT NULL
    AND v.id IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.count_orphan_vehicles() TO service_role;
GRANT EXECUTE ON FUNCTION public.count_orphan_leads() TO service_role;
