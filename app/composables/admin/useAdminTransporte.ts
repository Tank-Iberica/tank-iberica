/**
 * Admin Transporte Composable
 * Manages transport request CRUD operations and filtering.
 */

// ============================================
// TYPES
// ============================================
export interface VehicleInfo {
  title: string
  slug: string
}

export interface TransportRequest {
  id: string
  user_id: string
  vehicle_id: string
  origin: string | null
  destination_postal_code: string | null
  estimated_price_cents: number | null
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string | null
  vehicles: VehicleInfo
}

export type TabFilter = 'all' | 'pending' | 'inProgress' | 'completed' | 'cancelled'

export const STATUS_OPTIONS = [
  'quoted',
  'accepted',
  'in_transit',
  'completed',
  'cancelled',
] as const

// ============================================
// COMPOSABLE
// ============================================
export function useAdminTransporte() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()

  // ============================================
  // STATE
  // ============================================
  const requests = ref<TransportRequest[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const activeTab = ref<TabFilter>('all')
  const expandedId = ref<string | null>(null)
  const editingNotes = ref('')
  const savingNotes = ref(false)
  const updatingStatus = ref<string | null>(null)

  // ============================================
  // COMPUTED
  // ============================================
  const filteredRequests = computed(() => {
    if (activeTab.value === 'all') return requests.value

    const statusMap: Record<TabFilter, string[]> = {
      all: [],
      pending: ['quoted'],
      inProgress: ['accepted', 'in_transit'],
      completed: ['completed'],
      cancelled: ['cancelled'],
    }

    const statuses = statusMap[activeTab.value]
    return requests.value.filter((r) => statuses.includes(r.status))
  })

  const stats = computed(() => {
    const all = requests.value
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'quoted').length,
      inTransit: all.filter((r) => r.status === 'accepted' || r.status === 'in_transit').length,
      completedThisMonth: all.filter(
        (r) => r.status === 'completed' && r.updated_at && new Date(r.updated_at) >= startOfMonth,
      ).length,
    }
  })

  const tabCounts = computed(() => ({
    all: requests.value.length,
    pending: requests.value.filter((r) => r.status === 'quoted').length,
    inProgress: requests.value.filter((r) => r.status === 'accepted' || r.status === 'in_transit')
      .length,
    completed: requests.value.filter((r) => r.status === 'completed').length,
    cancelled: requests.value.filter((r) => r.status === 'cancelled').length,
  }))

  // ============================================
  // DATA LOADING
  // ============================================
  async function fetchRequests() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('transport_requests')
        .select('*, vehicles!inner(title, slug)')
        .order('created_at', { ascending: false })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      requests.value = (data as unknown as TransportRequest[]) || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ACTIONS
  // ============================================
  function toggleExpand(id: string) {
    if (expandedId.value === id) {
      expandedId.value = null
      editingNotes.value = ''
    } else {
      expandedId.value = id
      const req = requests.value.find((r) => r.id === id)
      editingNotes.value = req?.admin_notes || ''
    }
  }

  async function saveNotes(requestId: string) {
    savingNotes.value = true
    try {
      const { error: updateError } = await supabase
        .from('transport_requests')
        .update({ admin_notes: editingNotes.value.trim() || null })
        .eq('id', requestId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      const req = requests.value.find((r) => r.id === requestId)
      if (req) {
        req.admin_notes = editingNotes.value.trim() || null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      savingNotes.value = false
    }
  }

  async function updateStatus(requestId: string, newStatus: string) {
    updatingStatus.value = requestId
    try {
      const { error: updateError } = await supabase
        .from('transport_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      const req = requests.value.find((r) => r.id === requestId)
      if (req) {
        req.status = newStatus
        req.updated_at = new Date().toISOString()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      updatingStatus.value = null
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  function getStatusClass(status: string): string {
    const map: Record<string, string> = {
      quoted: 'status-pending',
      accepted: 'status-accepted',
      in_transit: 'status-transit',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    }
    return map[status] || 'status-pending'
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      quoted: t('admin.transporte.statusQuoted'),
      accepted: t('admin.transporte.statusAccepted'),
      in_transit: t('admin.transporte.statusInTransit'),
      completed: t('admin.transporte.statusCompleted'),
      cancelled: t('admin.transporte.statusCancelled'),
    }
    return map[status] || status
  }

  // ============================================
  // INIT (call from onMounted in the page)
  // ============================================
  function init() {
    fetchRequests()
  }

  return {
    // State
    requests,
    loading,
    error,
    activeTab,
    expandedId,
    editingNotes,
    savingNotes,
    updatingStatus,
    // Computed
    filteredRequests,
    stats,
    tabCounts,
    // Data loading
    fetchRequests,
    // Actions
    toggleExpand,
    saveNotes,
    updateStatus,
    // Helpers
    formatDate,
    getStatusClass,
    getStatusLabel,
    // Init
    init,
  }
}
