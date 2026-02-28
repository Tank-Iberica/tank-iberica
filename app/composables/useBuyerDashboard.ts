/**
 * Composable for the buyer dashboard.
 * Loads favorites, search alerts, contact history (leads sent), and recent views.
 */

interface Favorite {
  id: string
  vehicle_id: string
  created_at: string | null
  vehicle: {
    id: string
    brand: string
    model: string
    year: number | null
    price: number | null
    main_image_url: string | null
    slug: string | null
    status: string
  } | null
}

interface SearchAlert {
  id: string
  filters: Record<string, unknown>
  frequency: string | null
  active: boolean | null
  last_sent_at: string | null
  created_at: string | null
  updated_at: string | null
}

interface ContactHistoryItem {
  id: string
  dealer_id: string
  vehicle_id: string | null
  message: string | null
  status: string | null
  created_at: string | null
  first_responded_at: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  dealer_name: string | null
}

interface RecentView {
  vehicle_id: string
  viewed_at: string | null
  view_count: number | null
  vehicle: {
    id: string
    brand: string
    model: string
    year: number | null
    price: number | null
    main_image_url: string | null
    slug: string | null
    status: string
  } | null
}

interface DashboardSummary {
  favoritesCount: number
  activeAlertsCount: number
  leadsSentCount: number
  recentViewsCount: number
}

export function useBuyerDashboard() {
  const supabase = useSupabaseClient()
  const { userId } = useAuth()

  const favorites = ref<Favorite[]>([])
  const searchAlerts = ref<SearchAlert[]>([])
  const contactHistory = ref<ContactHistoryItem[]>([])
  const recentViews = ref<RecentView[]>([])
  const summary = ref<DashboardSummary>({
    favoritesCount: 0,
    activeAlertsCount: 0,
    leadsSentCount: 0,
    recentViewsCount: 0,
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFavorites(): Promise<void> {
    if (!userId.value) {
      error.value = 'User not authenticated'
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('favorites')
        .select(
          'id, vehicle_id, created_at, vehicles(id, brand, model, year, price, main_image_url, slug, status)',
        )
        .eq('user_id', userId.value)
        .order('created_at', { ascending: false })

      if (err) throw err

      favorites.value = (
        (data || []) as unknown as Array<{
          id: string
          vehicle_id: string
          created_at: string | null
          vehicles: {
            id: string
            brand: string
            model: string
            year: number | null
            price: number | null
            main_image_url: string | null
            slug: string | null
            status: string
          } | null
        }>
      ).map((fav) => ({
        id: fav.id,
        vehicle_id: fav.vehicle_id,
        created_at: fav.created_at,
        vehicle: fav.vehicles,
      }))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading favorites'
      favorites.value = []
    }
  }

  async function loadAlerts(): Promise<void> {
    if (!userId.value) {
      error.value = 'User not authenticated'
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('search_alerts')
        .select('id, filters, frequency, active, last_sent_at, created_at, updated_at')
        .eq('user_id', userId.value)
        .order('created_at', { ascending: false })

      if (err) throw err

      searchAlerts.value = (
        (data || []) as Array<{
          id: string
          filters: Record<string, unknown>
          frequency: string | null
          active: boolean | null
          last_sent_at: string | null
          created_at: string | null
          updated_at: string | null
        }>
      ).map((alert) => ({
        id: alert.id,
        filters: alert.filters,
        frequency: alert.frequency,
        active: alert.active,
        last_sent_at: alert.last_sent_at,
        created_at: alert.created_at,
        updated_at: alert.updated_at,
      }))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading search alerts'
      searchAlerts.value = []
    }
  }

  async function loadContactHistory(): Promise<void> {
    if (!userId.value) {
      error.value = 'User not authenticated'
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('leads')
        .select(
          'id, dealer_id, vehicle_id, message, status, created_at, first_responded_at, vehicles(brand, model), dealers(company_name)',
        )
        .eq('buyer_user_id', userId.value)
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) throw err

      contactHistory.value = (
        (data || []) as Array<{
          id: string
          dealer_id: string
          vehicle_id: string | null
          message: string | null
          status: string | null
          created_at: string | null
          first_responded_at: string | null
          vehicles: { brand: string; model: string } | null
          dealers: { company_name: string | Record<string, string> } | null
        }>
      ).map((lead) => {
        // Handle JSONB company_name (can be object with translations or string)
        let dealerName: string | null = null
        if (lead.dealers?.company_name) {
          if (typeof lead.dealers.company_name === 'string') {
            dealerName = lead.dealers.company_name
          } else if (typeof lead.dealers.company_name === 'object') {
            // Get first available language
            const names = lead.dealers.company_name as Record<string, string>
            dealerName = names.es || names.en || Object.values(names)[0] || null
          }
        }

        return {
          id: lead.id,
          dealer_id: lead.dealer_id,
          vehicle_id: lead.vehicle_id,
          message: lead.message,
          status: lead.status,
          created_at: lead.created_at,
          first_responded_at: lead.first_responded_at,
          vehicle_brand: lead.vehicles?.brand || null,
          vehicle_model: lead.vehicles?.model || null,
          dealer_name: dealerName,
        }
      })
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading contact history'
      contactHistory.value = []
    }
  }

  async function loadRecentViews(): Promise<void> {
    if (!userId.value) {
      error.value = 'User not authenticated'
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('user_vehicle_views')
        .select(
          'vehicle_id, viewed_at, view_count, vehicles(id, brand, model, year, price, main_image_url, slug, status)',
        )
        .eq('user_id', userId.value)
        .order('viewed_at', { ascending: false })
        .limit(20)

      if (err) throw err

      recentViews.value = (
        (data || []) as unknown as Array<{
          vehicle_id: string
          viewed_at: string | null
          view_count: number | null
          vehicles: {
            id: string
            brand: string
            model: string
            year: number | null
            price: number | null
            main_image_url: string | null
            slug: string | null
            status: string
          } | null
        }>
      ).map((view) => ({
        vehicle_id: view.vehicle_id,
        viewed_at: view.viewed_at,
        view_count: view.view_count,
        vehicle: view.vehicles,
      }))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading recent views'
      recentViews.value = []
    }
  }

  async function loadDashboardSummary(): Promise<DashboardSummary> {
    if (!userId.value) {
      error.value = 'User not authenticated'
      return {
        favoritesCount: 0,
        activeAlertsCount: 0,
        leadsSentCount: 0,
        recentViewsCount: 0,
      }
    }

    try {
      const [favoritesRes, alertsRes, leadsRes, viewsRes] = await Promise.all([
        // Favorites count
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId.value),

        // Active alerts count
        supabase
          .from('search_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId.value)
          .eq('active', true),

        // Leads sent count
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('buyer_user_id', userId.value),

        // Recent views count (last 30 days)
        supabase
          .from('user_vehicle_views')
          .select('vehicle_id', { count: 'exact', head: true })
          .eq('user_id', userId.value),
      ])

      summary.value = {
        favoritesCount: favoritesRes.count || 0,
        activeAlertsCount: alertsRes.count || 0,
        leadsSentCount: leadsRes.count || 0,
        recentViewsCount: viewsRes.count || 0,
      }

      return summary.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading dashboard summary'
      return {
        favoritesCount: 0,
        activeAlertsCount: 0,
        leadsSentCount: 0,
        recentViewsCount: 0,
      }
    }
  }

  async function loadAllDashboardData(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await Promise.all([
        loadFavorites(),
        loadAlerts(),
        loadContactHistory(),
        loadRecentViews(),
        loadDashboardSummary(),
      ])
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading dashboard data'
    } finally {
      loading.value = false
    }
  }

  return {
    favorites: readonly(favorites),
    searchAlerts: readonly(searchAlerts),
    contactHistory: readonly(contactHistory),
    recentViews: readonly(recentViews),
    summary: readonly(summary),
    loading: readonly(loading),
    error,
    loadFavorites,
    loadAlerts,
    loadContactHistory,
    loadRecentViews,
    loadDashboardSummary,
    loadAllDashboardData,
  }
}
