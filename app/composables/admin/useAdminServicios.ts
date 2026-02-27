// ============================================
// TYPES
// ============================================
export interface ServicioVehicleInfo {
  title: string
  slug: string
}

export interface ServiceRequest {
  id: string
  user_id: string
  vehicle_id: string | null
  type: string
  status: string
  details: Record<string, unknown> | null
  partner_notified_at: string | null
  created_at: string
  updated_at: string | null
  vehicles: ServicioVehicleInfo | null
}

export type TypeFilter = 'all' | 'transport' | 'transfer' | 'insurance' | 'inspection'
export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export const STATUS_OPTIONS: ServiceStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']

export const TYPE_TABS: TypeFilter[] = ['all', 'transport', 'transfer', 'insurance', 'inspection']

const TYPE_ICONS: Record<string, string> = {
  transport: '\uD83D\uDE9B',
  transfer: '\uD83D\uDCC4',
  insurance: '\uD83D\uDEE1',
  inspection: '\uD83D\uDD0D',
}

export function useAdminServicios() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()

  // ============================================
  // STATE
  // ============================================
  const requests = ref<ServiceRequest[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const activeTab = ref<TypeFilter>('all')
  const expandedId = ref<string | null>(null)
  const updatingStatus = ref<string | null>(null)
  const notifyingPartner = ref<string | null>(null)

  // ============================================
  // COMPUTED
  // ============================================
  const filteredRequests = computed(() => {
    if (activeTab.value === 'all') return requests.value
    return requests.value.filter((r) => r.type === activeTab.value)
  })

  const tabCounts = computed(() => ({
    all: requests.value.length,
    transport: requests.value.filter((r) => r.type === 'transport').length,
    transfer: requests.value.filter((r) => r.type === 'transfer').length,
    insurance: requests.value.filter((r) => r.type === 'insurance').length,
    inspection: requests.value.filter((r) => r.type === 'inspection').length,
  }))

  // ============================================
  // DATA LOADING
  // ============================================
  async function fetchRequests() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('service_requests')
        .select('*, vehicles(title, slug)')
        .order('created_at', { ascending: false })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      requests.value = (data as unknown as ServiceRequest[]) || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ACTIONS
  // ============================================
  function init() {
    fetchRequests()
  }

  function toggleExpand(id: string) {
    expandedId.value = expandedId.value === id ? null : id
  }

  function setActiveTab(tab: TypeFilter) {
    activeTab.value = tab
  }

  function clearError() {
    error.value = null
  }

  async function updateStatus(requestId: string, newStatus: string) {
    updatingStatus.value = requestId
    try {
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        } as never)
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

  async function notifyPartner(requestId: string) {
    notifyingPartner.value = requestId
    try {
      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({ partner_notified_at: now } as never)
        .eq('id', requestId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      const req = requests.value.find((r) => r.id === requestId)
      if (req) {
        req.partner_notified_at = now
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      notifyingPartner.value = null
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  function getTypeIcon(type: string): string {
    return TYPE_ICONS[type] || '\u2699'
  }

  function getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      transport: t('admin.servicios.typeTransport'),
      transfer: t('admin.servicios.typeTransfer'),
      insurance: t('admin.servicios.typeInsurance'),
      inspection: t('admin.servicios.typeInspection'),
      financing: t('admin.servicios.typeFinancing'),
    }
    return map[type] || type
  }

  function getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      in_progress: 'status-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    }
    return map[status] || 'status-pending'
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: t('admin.servicios.statusPending'),
      in_progress: t('admin.servicios.statusInProgress'),
      completed: t('admin.servicios.statusCompleted'),
      cancelled: t('admin.servicios.statusCancelled'),
    }
    return map[status] || status
  }

  function formatDetailValue(value: unknown): string {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return {
    // State
    requests: readonly(requests),
    loading: readonly(loading),
    error: readonly(error),
    activeTab: readonly(activeTab),
    expandedId: readonly(expandedId),
    updatingStatus: readonly(updatingStatus),
    notifyingPartner: readonly(notifyingPartner),

    // Computed
    filteredRequests,
    tabCounts,

    // Actions
    init,
    fetchRequests,
    toggleExpand,
    setActiveTab,
    clearError,
    updateStatus,
    notifyPartner,

    // Helpers
    formatDate,
    getTypeIcon,
    getTypeLabel,
    getStatusClass,
    getStatusLabel,
    formatDetailValue,
  }
}
