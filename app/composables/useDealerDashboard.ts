/**
 * Composable for the dealer dashboard home.
 * Loads dealer profile, KPI stats, and recent leads.
 */

interface DealerProfile {
  id: string
  user_id: string
  company_name: string | null
  slug: string | null
  bio: string | null
  logo_url: string | null
  phone: string | null
  email: string | null
  website: string | null
  location: string | null
  theme_primary: string | null
  theme_accent: string | null
  social_links: Record<string, string> | null
  certifications: string[] | null
  auto_reply_message: string | null
  onboarding_completed: boolean
  created_at: string | null
}

interface DashboardStats {
  activeListings: number
  totalLeads: number
  totalViews: number
  leadsThisMonth: number
  responseRate: number
  contactsThisMonth: number
  fichaViewsThisMonth: number
  conversionRate: number
}

interface RecentLead {
  id: string
  buyer_name: string | null
  buyer_email: string | null
  vehicle_id: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  status: string
  message: string | null
  created_at: string | null
}

interface TopVehicle {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  views: number
  leads: number
  favorites: number
  status: string
}

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
      const { data, error: err } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', userId.value)
        .single()

      if (err) throw err
      dealerProfile.value = data as DealerProfile
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

      // Fetch stats in parallel
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        activeListingsRes,
        totalLeadsRes,
        monthLeadsRes,
        viewsRes,
        recentLeadsRes,
        topVehiclesRes,
      ] = await Promise.all([
        // Active listings count
        supabase
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('dealer_id', dealer.id)
          .eq('status', 'published'),

        // Total leads count
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('dealer_id', dealer.id),

        // Leads this month
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('dealer_id', dealer.id)
          .gte('created_at', monthStart),

        // Total views from dealer_stats or vehicles
        supabase
          .from('dealer_stats')
          .select('total_views')
          .eq('dealer_id', dealer.id)
          .maybeSingle(),

        // Recent leads (last 5)
        supabase
          .from('leads')
          .select(
            'id, buyer_name, buyer_email, vehicle_id, status, message, created_at, vehicles(brand, model)',
          )
          .eq('dealer_id', dealer.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // Top vehicles by views
        supabase
          .from('vehicles')
          .select('id, brand, model, year, price, views, status')
          .eq('dealer_id', dealer.id)
          .eq('status', 'published')
          .order('views', { ascending: false })
          .limit(5),
      ])

      // Calculate response rate from leads
      let responseRate = 0
      if (totalLeadsRes.count && totalLeadsRes.count > 0) {
        const { count: respondedCount } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('dealer_id', dealer.id)
          .neq('status', 'new')

        responseRate = respondedCount ? Math.round((respondedCount / totalLeadsRes.count) * 100) : 0
      }

      // Lead tracking metrics from analytics_events
      const [contactClicksRes, fichaViewsRes] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'contact_click')
          .contains('metadata', { dealer_id: dealer.id })
          .gte('created_at', monthStart),
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'ficha_view')
          .contains('metadata', { dealer_id: dealer.id })
          .gte('created_at', monthStart),
      ])

      const contactsThisMonth = contactClicksRes.count || 0
      const fichaViewsThisMonth = fichaViewsRes.count || 0
      const conversionRate =
        fichaViewsThisMonth > 0
          ? Math.round((contactsThisMonth / fichaViewsThisMonth) * 1000) / 10
          : 0

      stats.value = {
        activeListings: activeListingsRes.count || 0,
        totalLeads: totalLeadsRes.count || 0,
        totalViews: (viewsRes.data as { total_views: number } | null)?.total_views || 0,
        leadsThisMonth: monthLeadsRes.count || 0,
        responseRate,
        contactsThisMonth,
        fichaViewsThisMonth,
        conversionRate,
      }

      // Map recent leads with vehicle info
      recentLeads.value = (
        (recentLeadsRes.data || []) as Array<{
          id: string
          buyer_name: string | null
          buyer_email: string | null
          vehicle_id: string | null
          status: string
          message: string | null
          created_at: string | null
          vehicles: { brand: string; model: string } | null
        }>
      ).map((lead) => ({
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

      // Map top vehicles
      const topVehiclesMapped = (
        (topVehiclesRes.data || []) as Array<{
          id: string
          brand: string
          model: string
          year: number | null
          price: number | null
          views: number
          status: string
        }>
      ).map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        price: v.price,
        views: v.views || 0,
        leads: 0,
        favorites: 0,
        status: v.status,
      }))

      // Fetch favorites counts for top vehicles
      const topVehicleIds = topVehiclesMapped.map((v) => v.id)
      if (topVehicleIds.length > 0) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('vehicle_id')
          .in('vehicle_id', topVehicleIds)

        if (favData) {
          const favCounts: Record<string, number> = {}
          for (const row of favData as Array<{ vehicle_id: string }>) {
            favCounts[row.vehicle_id] = (favCounts[row.vehicle_id] || 0) + 1
          }
          for (const v of topVehiclesMapped) {
            v.favorites = favCounts[v.id] || 0
          }
        }
      }

      topVehicles.value = topVehiclesMapped
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
