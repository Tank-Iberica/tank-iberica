/**
 * useTopDealers — Public scoreboard composable (#55)
 *
 * Fetches top-rated dealers by trust_score for the public scoreboard page.
 * Only includes dealers with trust_score >= 60 (verified or top).
 */

export interface TopDealerPublic {
  id: string
  company_name: string | null
  trust_score: number
  badge: 'top' | 'verified'
  vehicle_count: number
  location_province: string | null
  verified_at: string | null
}

/** Composable for top dealers. */
export function useTopDealers() {
  const supabase = useSupabaseClient()

  const dealers = ref<TopDealerPublic[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadTopDealers(limit = 100): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchErr } = await (supabase as ReturnType<typeof useSupabaseClient>)
        .from('dealers')
        .select('id, company_name, trust_score, location_province, verified_at')
        .gte('trust_score', 60)
        .order('trust_score', { ascending: false })
        .limit(limit)

      if (fetchErr) {
        error.value = fetchErr.message
        return
      }

      type DealerRow = {
        id: string
        company_name: string | null
        trust_score: number
        location_province: string | null
        verified_at: string | null
      }

      const rows = (data || []) as DealerRow[]

      // Fetch vehicle counts for all dealers in one query
      const dealerIds = rows.map((d) => d.id)
      const vehicleCounts = new Map<string, number>()

      if (dealerIds.length) {
        const { data: vehicleData } = await (supabase as ReturnType<typeof useSupabaseClient>)
          .from('vehicles')
          .select('dealer_id')
          .in('dealer_id', dealerIds)
          .eq('status', 'published')

        if (vehicleData) {
          for (const row of vehicleData as Array<{ dealer_id: string }>) {
            vehicleCounts.set(row.dealer_id, (vehicleCounts.get(row.dealer_id) || 0) + 1)
          }
        }
      }

      dealers.value = rows.map((d) => ({
        id: d.id,
        company_name: d.company_name,
        trust_score: d.trust_score,
        badge: d.trust_score >= 80 ? ('top' as const) : ('verified' as const),
        vehicle_count: vehicleCounts.get(d.id) || 0,
        location_province: d.location_province,
        verified_at: d.verified_at,
      }))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return {
    dealers: readonly(dealers),
    loading: readonly(loading),
    error: readonly(error),
    loadTopDealers,
  }
}
