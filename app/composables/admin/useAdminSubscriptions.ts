/**
 * Admin Subscriptions Composable
 * Manage newsletter/notification subscriptions in admin panel
 */

export interface AdminSubscription {
  id: string
  email: string
  pref_web: boolean
  pref_press: boolean
  pref_newsletter: boolean
  pref_featured: boolean
  pref_events: boolean
  pref_csr: boolean
  created_at: string
}

export interface SubscriptionFilters {
  search?: string
}

export const SUBSCRIPTION_PREFS: { key: keyof AdminSubscription; label: string; color: string }[] = [
  { key: 'pref_web', label: 'Web', color: '#3b82f6' },
  { key: 'pref_press', label: 'Prensa', color: '#8b5cf6' },
  { key: 'pref_newsletter', label: 'Boletines', color: '#10b981' },
  { key: 'pref_featured', label: 'Destacados', color: '#f59e0b' },
  { key: 'pref_events', label: 'Eventos', color: '#ef4444' },
  { key: 'pref_csr', label: 'RSC', color: '#06b6d4' },
]

const PAGE_SIZE = 100

export function useAdminSubscriptions() {
  const supabase = useSupabaseClient()

  const subscriptions = ref<AdminSubscription[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  /**
   * Fetch all subscriptions with filters
   */
  async function fetchSubscriptions(filters: SubscriptionFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('subscriptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.search) {
        query = query.ilike('email', `%${filters.search}%`)
      }

      const { data, error: err, count } = await query.range(0, PAGE_SIZE - 1)

      if (err) throw err

      subscriptions.value = (data as unknown as AdminSubscription[]) || []
      total.value = count || 0
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching subscriptions'
      subscriptions.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Delete subscription
   */
  async function deleteSubscription(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)

      if (err) throw err

      subscriptions.value = subscriptions.value.filter(s => s.id !== id)
      total.value--

      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting subscription'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Export subscriptions as CSV
   */
  function exportCSV(subList: AdminSubscription[]) {
    if (subList.length === 0) return

    const headers = ['Email', 'Web', 'Prensa', 'Boletines', 'Destacados', 'Eventos', 'RSC', 'Fecha']
    const rows = subList.map(s => [
      s.email,
      s.pref_web ? 'Sí' : 'No',
      s.pref_press ? 'Sí' : 'No',
      s.pref_newsletter ? 'Sí' : 'No',
      s.pref_featured ? 'Sí' : 'No',
      s.pref_events ? 'Sí' : 'No',
      s.pref_csr ? 'Sí' : 'No',
      new Date(s.created_at).toLocaleDateString('es-ES'),
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `suscripciones_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    subscriptions: readonly(subscriptions),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    fetchSubscriptions,
    deleteSubscription,
    exportCSV,
  }
}
