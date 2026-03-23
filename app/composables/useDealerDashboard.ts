/**
 * Composable for the dealer dashboard home.
 * Loads dealer profile, KPI stats, and recent leads.
 *
 * Query reduction (§1.5 Plan Maestro):
 *   Before: 10 round-trips (6 parallel + 1 sequential + 2 parallel + 1 sequential)
 *   After:  3 parallel queries → 1 round-trip
 *     1. get_dealer_dashboard_stats RPC  → all 8 KPIs
 *     2. PostgREST leads query           → recent leads with vehicle join
 *     3. get_dealer_top_vehicles RPC     → top vehicles with leads + favorites
 */
import type {
  DealerProfile,
  DashboardStats,
  RecentLead,
  TopVehicle,
  DashboardStatsRaw,
  TopVehicleRaw,
  RawLead,
} from './shared/dealerDashboardTypes'

export type { DealerProfile, DashboardStats, RecentLead } from './shared/dealerDashboardTypes'

export function mapLeads(raw: RawLead[]): RecentLead[] {
  return raw.map((lead) => ({
    id: lead.id,
    buyer_name: lead.buyer_name,
    buyer_email: lead.buyer_email,
    vehicle_id: lead.vehicle_id,
    vehicle_brand: lead.vehicles?.brand || null,
    vehicle_model: lead.vehicles?.model || null,
    status: lead.status,
    message: lead.message,
    created_at: lead.created_at,
  }))
}

/** Composable for dealer dashboard. */
export function useDealerDashboard() {
  const supabase = useSupabaseClient()
  const { userId } = useAuth()

  const dealerProfile = ref<DealerProfile | null>(null)
  const stats = ref<DashboardStats>({
    activeListings: 0,
    totalLeads: 0,
    totalViews: 0,
    leadsThisMonth: 0,
    responseRate: 0,
    contactsThisMonth: 0,
    fichaViewsThisMonth: 0,
    conversionRate: 0,
  })
  const recentLeads = ref<RecentLead[]>([])
  const topVehicles = ref<TopVehicle[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadDealer(): Promise<DealerProfile | null> {
    if (!userId.value) return null

    try {
      const { data, error: err } = await (supabase as ReturnType<typeof useSupabaseClient>)
        .from('dealers')
        .select(
          'id, user_id, company_name, slug, bio, logo_url, phone, email, website, location, theme_primary, theme_accent, social_links, certifications, auto_reply_message, onboarding_completed, created_at',
        )
        .eq('user_id', userId.value)
        .single()

      if (err) throw err
      dealerProfile.value = data as unknown as DealerProfile
      return dealerProfile.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading dealer profile'
      return null
    }
  }

  async function loadDashboardData(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = 'Dealer profile not found'
        return
      }

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const vertical = getVerticalSlug()

      // 3 queries in parallel → 1 round-trip (was 10 queries / 4 round-trips)
      const [statsRes, recentLeadsRes, topVehiclesRes] = await Promise.all([
        // All 8 KPIs in one server-side CTE
        supabase.rpc('get_dealer_dashboard_stats', {
          p_dealer_id: dealer.id,
          p_vertical: vertical,
          p_month_start: monthStart,
        }),

        // Recent leads — PostgREST join (already a single query)
        supabase
          .from('leads')
          .select(
            'id, buyer_name, buyer_email, vehicle_id, status, message, created_at, vehicles(brand, model)',
          )
          .eq('dealer_id', dealer.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // Top vehicles with leads + favorites (was 2 queries, now 1 RPC)
        supabase.rpc('get_dealer_top_vehicles', {
          p_dealer_id: dealer.id,
          p_vertical: vertical,
          p_limit: 5,
        }),
      ])

      // Map stats RPC response (returns array with one row for RETURNS TABLE functions)
      const statsRow =
        Array.isArray(statsRes.data) && statsRes.data.length
          ? (statsRes.data[0] as DashboardStatsRaw)
          : null

      if (statsRes.error || !statsRow) {
        throw statsRes.error || new Error('Dashboard stats RPC returned no data')
      }

      stats.value = {
        activeListings: statsRow.active_listings ?? 0,
        totalLeads: statsRow.total_leads ?? 0,
        totalViews: statsRow.total_views ?? 0,
        leadsThisMonth: statsRow.leads_this_month ?? 0,
        responseRate: statsRow.response_rate ?? 0,
        contactsThisMonth: statsRow.contacts_this_month ?? 0,
        fichaViewsThisMonth: statsRow.ficha_views_this_month ?? 0,
        conversionRate: statsRow.conversion_rate ?? 0,
      }

      recentLeads.value = mapLeads((recentLeadsRes.data || []) as RawLead[])

      // Map top vehicles — leads and favorites now included from the RPC
      topVehicles.value = ((topVehiclesRes.data || []) as TopVehicleRaw[]).map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        price: v.price,
        views: v.views || 0,
        leads: v.leads || 0,
        favorites: v.favorites || 0,
        status: v.status,
      }))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading dashboard data'
    } finally {
      loading.value = false
    }
  }

  return {
    dealerProfile: readonly(dealerProfile),
    stats: readonly(stats),
    recentLeads: readonly(recentLeads),
    topVehicles: readonly(topVehicles),
    loading: readonly(loading),
    error,
    loadDealer,
    loadDashboardData,
  }
}
