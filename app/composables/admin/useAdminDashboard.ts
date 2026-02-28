/**
 * Admin Dashboard Composable
 * Extracts all data-fetching and state logic from the admin dashboard page.
 *
 * The page calls `init()` in onMounted to kick off parallel data loading.
 * Each sub-loader is wrapped in try/catch so individual failures do not
 * break the whole dashboard.
 */

import { useAdminMetrics } from '~/composables/admin/useAdminMetrics'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationStats {
  anunciantes: number
  anunciantesPending: number
  solicitantes: number
  solicitantesPending: number
  comentarios: number
  comentariosPending: number
  chats: number
  chatsUnread: number
  suscripciones: number
  suscripcionesPending: number
}

export interface ProductCategoryCount {
  name: string
  count: number
}

export interface ProductStats {
  total: number
  published: number
  unpublished: number
  byCategory: ProductCategoryCount[]
  byType: ProductCategoryCount[]
}

export interface UserStats {
  visits: number
  uniqueVisits: number
  registered: number
  buyers: number
  renters: number
  requests: number
  advertisers: number
  newsVisits: number
  newsComments: number
}

export interface MatchItem {
  id: string
  type: 'demand' | 'vehicle'
  typeLabel: string
  description: string
  link: string
}

export interface SectionsOpenState {
  products: boolean
  users: boolean
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAdminDashboard() {
  const supabase = useSupabaseClient()

  // Re-export KPI data from useAdminMetrics
  const { kpiSummary, loadMetrics: loadKpiMetrics } = useAdminMetrics()

  // -- Reactive state -------------------------------------------------------

  const stats = ref<NotificationStats>({
    anunciantes: 0,
    anunciantesPending: 0,
    solicitantes: 0,
    solicitantesPending: 0,
    comentarios: 0,
    comentariosPending: 0,
    chats: 0,
    chatsUnread: 0,
    suscripciones: 0,
    suscripcionesPending: 0,
  })

  const productStats = ref<ProductStats>({
    total: 0,
    published: 0,
    unpublished: 0,
    byCategory: [],
    byType: [],
  })

  const userStats = ref<UserStats>({
    visits: 0,
    uniqueVisits: 0,
    registered: 0,
    buyers: 0,
    renters: 0,
    requests: 0,
    advertisers: 0,
    newsVisits: 0,
    newsComments: 0,
  })

  const bannerEnabled = ref(false)
  const bannerText = ref('')

  const sectionsOpen = ref<SectionsOpenState>({
    products: false,
    users: false,
  })

  const matches = ref<MatchItem[]>([])

  // -- Computed --------------------------------------------------------------

  const totalPending = computed(
    () =>
      stats.value.anunciantesPending +
      stats.value.solicitantesPending +
      stats.value.comentariosPending +
      stats.value.chatsUnread,
  )

  // -- Helpers ---------------------------------------------------------------

  function formatKpiEuros(cents: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  function kpiChangeClass(pct: number): string {
    if (pct > 0) return 'kpi-change-up'
    if (pct < 0) return 'kpi-change-down'
    return 'kpi-change-flat'
  }

  function formatCategory(category: string): string {
    const map: Record<string, string> = {
      venta: 'Venta',
      alquiler: 'Alquiler',
      terceros: 'Terceros',
    }
    return map[category] || category
  }

  // -- Data loaders ----------------------------------------------------------

  async function loadBannerConfig(): Promise<void> {
    try {
      const { data } = await supabase.from('config').select('value').eq('key', 'banner').single()

      if (data?.value) {
        const val = data.value as Record<string, unknown>
        bannerEnabled.value = (val.enabled as boolean) || false
        bannerText.value = (val.text_es as string) || (val.text as string) || ''
      }
    } catch {
      // Config not found
    }
  }

  async function toggleBanner(): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'banner')
        .single()

      const newEnabledState = !bannerEnabled.value

      const existingVal = (existing?.value ?? {}) as Record<string, unknown>
      const newValue = {
        ...existingVal,
        enabled: newEnabledState,
      }

      const { error: err } = await supabase
        .from('config')
        .upsert({ key: 'banner', value: newValue } as never)

      if (err) throw err

      bannerEnabled.value = newEnabledState
    } catch (err) {
      if (import.meta.dev) console.error('Error toggling banner:', err)
    }
  }

  async function loadMatches(): Promise<void> {
    // TODO(2026-02): Implementar logica de coincidencias entre solicitantes y vehiculos (requiere tabla de demandas cruzadas)
    matches.value = []
  }

  async function loadAnunciantes(): Promise<void> {
    try {
      const { data, count } = await supabase
        .from('advertisements')
        .select('status', { count: 'exact' })

      stats.value.anunciantes = count || 0
      stats.value.anunciantesPending = (data || []).filter(
        (a: { status: string | null }) => a.status === 'pending',
      ).length
    } catch {
      // Table doesn't exist yet
    }
  }

  async function loadSolicitantes(): Promise<void> {
    try {
      const { data, count } = await supabase.from('demands').select('status', { count: 'exact' })

      stats.value.solicitantes = count || 0
      stats.value.solicitantesPending = (data || []).filter(
        (s: { status: string | null }) => s.status === 'pending',
      ).length
    } catch {
      // Table doesn't exist yet
    }
  }

  async function loadComentarios(): Promise<void> {
    try {
      const { data, count } = await supabase.from('comments').select('status', { count: 'exact' })

      stats.value.comentarios = count || 0
      stats.value.comentariosPending = (data || []).filter(
        (c: { status: string }) => c.status === 'pending',
      ).length
    } catch {
      // Table doesn't exist yet
    }
  }

  async function loadChats(): Promise<void> {
    try {
      const { data } = await supabase.from('chat_messages').select('is_read, user_id')

      const uniqueUsers = new Set((data || []).map((c: { user_id: string | null }) => c.user_id))
      stats.value.chats = uniqueUsers.size
      stats.value.chatsUnread = (data || []).filter(
        (c: { is_read: boolean | null }) => !c.is_read,
      ).length
    } catch {
      // Table doesn't exist yet
    }
  }

  async function loadSuscripciones(): Promise<void> {
    try {
      const { count } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })

      stats.value.suscripciones = count || 0
      stats.value.suscripcionesPending = 0
    } catch {
      // Table doesn't exist yet
    }
  }

  async function loadProductStats(): Promise<void> {
    try {
      const { data: vehicles } = await supabase.from('vehicles').select('status, category')

      const all = vehicles || []
      productStats.value.total = all.length
      productStats.value.published = all.filter(
        (v: { status: string | null }) => v.status === 'published',
      ).length
      productStats.value.unpublished = all.filter(
        (v: { status: string | null }) => v.status !== 'published',
      ).length

      // By category
      const categoryMap = new Map<string, number>()
      all.forEach((v: { category: string | null }) => {
        const cat = v.category || 'Sin categoria'
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
      })
      productStats.value.byCategory = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name: formatCategory(name), count }))
        .sort((a, b) => b.count - a.count)

      productStats.value.byType = []
    } catch (err) {
      if (import.meta.dev) console.error('Error loading product stats:', err)
    }
  }

  async function loadUserStats(): Promise<void> {
    try {
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      userStats.value.registered = usersCount || 0

      // Advertisers
      try {
        const { data: ads } = await supabase.from('advertisements').select('user_id')
        const uniqueAdvertisers = new Set(
          (ads || []).map((a: { user_id: string | null }) => a.user_id),
        )
        userStats.value.advertisers = uniqueAdvertisers.size
      } catch {
        // Table doesn't exist
      }

      // Requests
      try {
        const { count: demandsCount } = await supabase
          .from('demands')
          .select('*', { count: 'exact', head: true })
        userStats.value.requests = demandsCount || 0
      } catch {
        // Table doesn't exist
      }

      // Comments count
      try {
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
        userStats.value.newsComments = commentsCount || 0
      } catch {
        // Table doesn't exist
      }

      // Placeholder values
      userStats.value.visits = 0
      userStats.value.uniqueVisits = 0
      userStats.value.newsVisits = 0
      userStats.value.buyers = 0
      userStats.value.renters = 0
    } catch (err) {
      if (import.meta.dev) console.error('Error loading user stats:', err)
    }
  }

  async function loadStats(): Promise<void> {
    try {
      await Promise.all([
        loadAnunciantes(),
        loadSolicitantes(),
        loadComentarios(),
        loadChats(),
        loadSuscripciones(),
        loadProductStats(),
        loadUserStats(),
        loadBannerConfig(),
        loadMatches(),
      ])
    } catch (err) {
      if (import.meta.dev) console.error('Error loading stats:', err)
    }
  }

  // -- Init (called by the page in onMounted) --------------------------------

  async function init(): Promise<void> {
    await Promise.all([loadStats(), loadKpiMetrics()])
  }

  // -- Toggle section open/close ---------------------------------------------

  function toggleSection(section: keyof SectionsOpenState): void {
    sectionsOpen.value[section] = !sectionsOpen.value[section]
  }

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // KPI (from useAdminMetrics)
    kpiSummary,
    formatKpiEuros,
    kpiChangeClass,

    // Notification stats
    stats: readonly(stats),
    totalPending,

    // Product stats
    productStats: readonly(productStats),

    // User stats
    userStats: readonly(userStats),

    // Banner
    bannerEnabled: readonly(bannerEnabled),
    bannerText: readonly(bannerText),
    toggleBanner,

    // Collapsible sections
    sectionsOpen: readonly(sectionsOpen),
    toggleSection,

    // Matches
    matches: readonly(matches),

    // Actions
    init,
  }
}
