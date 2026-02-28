// ============================================
// TYPES
// ============================================
export type ReportStatus = 'pending' | 'reviewing' | 'resolved_removed' | 'resolved_kept'

export interface Report {
  id: string
  vertical: string
  reporter_email: string
  entity_type: string
  entity_id: string
  reason: string
  details: string | null
  status: ReportStatus
  admin_notes: string | null
  resolved_at: string | null
  created_at: string
}

export interface FilterOption {
  value: ReportStatus | 'all'
  labelKey: string
}

// ============================================
// CONSTANTS
// ============================================
export const reportFilters: FilterOption[] = [
  { value: 'all', labelKey: 'report.admin.filterAll' },
  { value: 'pending', labelKey: 'report.admin.filterPending' },
  { value: 'reviewing', labelKey: 'report.admin.filterReviewing' },
  { value: 'resolved_removed', labelKey: 'report.admin.filterResolvedRemoved' },
  { value: 'resolved_kept', labelKey: 'report.admin.filterResolvedKept' },
]

export const statusColors: Record<ReportStatus, string> = {
  pending: '#F59E0B',
  reviewing: '#3B82F6',
  resolved_removed: '#EF4444',
  resolved_kept: '#22C55E',
}

export const statusLabels: Record<ReportStatus, string> = {
  pending: 'report.admin.statusPending',
  reviewing: 'report.admin.statusReviewing',
  resolved_removed: 'report.admin.statusResolvedRemoved',
  resolved_kept: 'report.admin.statusResolvedKept',
}

// ============================================
// HELPERS (pure functions)
// ============================================
export function formatReportDate(d: string): string {
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncateEmail(email: string): string {
  if (email.length <= 24) return email
  const atIndex = email.indexOf('@')
  if (atIndex > 12) {
    return email.substring(0, 10) + '...' + email.substring(atIndex)
  }
  return email
}

// ============================================
// COMPOSABLE
// ============================================
export function useAdminReportes() {
  const supabase = useSupabaseClient()

  // ============================================
  // STATE
  // ============================================
  const reports = ref<Report[]>([])
  const loading = ref(true)
  const activeFilter = ref<ReportStatus | 'all'>('all')
  const expandedId = ref<string | null>(null)
  const savingId = ref<string | null>(null)
  const editNotes = ref<Record<string, string>>({})

  // ============================================
  // COMPUTED
  // ============================================
  const pendingCount = computed(() => {
    return reports.value.filter((r) => r.status === 'pending').length
  })

  // ============================================
  // DATA LOADING
  // ============================================
  async function loadReports() {
    loading.value = true
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false })

    if (activeFilter.value !== 'all') {
      query = query.eq('status', activeFilter.value)
    }

    const { data } = await query
    reports.value = (data as unknown as Report[] | null) ?? []
    loading.value = false
  }

  // ============================================
  // ACTIONS
  // ============================================
  async function updateStatus(reportId: string, newStatus: ReportStatus) {
    savingId.value = reportId
    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus.startsWith('resolved')) {
      updates.resolved_at = new Date().toISOString()
    }
    await supabase.from('reports').update(updates).eq('id', reportId)
    await loadReports()
    savingId.value = null
  }

  async function saveNotes(reportId: string) {
    const notes = editNotes.value[reportId] ?? ''
    savingId.value = reportId
    await supabase.from('reports').update({ admin_notes: notes }).eq('id', reportId)

    // Update locally
    const idx = reports.value.findIndex((r) => r.id === reportId)
    if (idx !== -1) {
      reports.value[idx] = { ...reports.value[idx]!, admin_notes: notes }
    }
    savingId.value = null
  }

  function toggleExpand(id: string) {
    if (expandedId.value === id) {
      expandedId.value = null
    } else {
      expandedId.value = id
      // Pre-fill notes editor with existing notes
      const report = reports.value.find((r) => r.id === id)
      if (report) {
        editNotes.value[id] = report.admin_notes ?? ''
      }
    }
  }

  function updateEditNotes(reportId: string, value: string) {
    editNotes.value[reportId] = value
  }

  function getEditNotes(reportId: string): string {
    return editNotes.value[reportId] ?? ''
  }

  // ============================================
  // INIT (replaces onMounted)
  // ============================================
  function init() {
    loadReports()
    watch(activeFilter, loadReports)
  }

  return {
    // State
    reports,
    loading,
    activeFilter,
    expandedId,
    savingId,
    editNotes,
    // Computed
    pendingCount,
    // Actions
    loadReports,
    updateStatus,
    saveNotes,
    toggleExpand,
    updateEditNotes,
    getEditNotes,
    // Init
    init,
  }
}
