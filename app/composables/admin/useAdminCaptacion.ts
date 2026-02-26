import { getVerticalSlug } from '~/composables/useVerticalConfig'

// ============================================
// TYPES
// ============================================
export interface DealerLead {
  id: string
  vertical: string
  source: string
  source_url: string | null
  company_name: string
  phone: string | null
  email: string | null
  location: string | null
  active_listings: number
  vehicle_types: string[]
  status: LeadStatus
  assigned_to: string | null
  contact_notes: string | null
  contacted_at: string | null
  scraped_at: string | null
  created_at: string
  updated_at: string | null
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
}

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'onboarding' | 'active' | 'rejected'
export type TabFilter =
  | 'all'
  | 'new'
  | 'contacted'
  | 'interested'
  | 'onboarding'
  | 'active'
  | 'rejected'

export const STATUS_OPTIONS: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'onboarding',
  'active',
  'rejected',
]

export const SOURCE_LIST = [
  'mascus',
  'europa_camiones',
  'milanuncios',
  'autoline',
  'manual',
] as const

export function useAdminCaptacion() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()

  // ============================================
  // STATE
  // ============================================
  const leads = ref<DealerLead[]>([])
  const adminUsers = ref<AdminUser[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const activeTab = ref<TabFilter>('all')
  const expandedId = ref<string | null>(null)
  const editingNotes = ref('')
  const savingNotes = ref(false)
  const updatingStatus = ref<string | null>(null)
  const updatingAssign = ref<string | null>(null)

  // Bulk selection
  const selectedIds = ref<Set<string>>(new Set())
  const bulkProcessing = ref(false)

  // Manual lead form
  const showManualForm = ref(false)
  const manualFormSaving = ref(false)
  const manualForm = ref({
    company_name: '',
    phone: '',
    email: '',
    location: '',
    active_listings: 0,
    vehicle_types: '',
    source_url: '',
  })

  // ============================================
  // COMPUTED
  // ============================================
  const filteredLeads = computed(() => {
    if (activeTab.value === 'all') return leads.value
    return leads.value.filter((l) => l.status === activeTab.value)
  })

  const stats = computed(() => {
    const all = leads.value
    return {
      total: all.length,
      new: all.filter((l) => l.status === 'new').length,
      contacted: all.filter((l) => l.status === 'contacted').length,
      interested: all.filter((l) => l.status === 'interested').length,
      active: all.filter((l) => l.status === 'active').length,
    }
  })

  const tabCounts = computed(() => ({
    all: leads.value.length,
    new: leads.value.filter((l) => l.status === 'new').length,
    contacted: leads.value.filter((l) => l.status === 'contacted').length,
    interested: leads.value.filter((l) => l.status === 'interested').length,
    onboarding: leads.value.filter((l) => l.status === 'onboarding').length,
    active: leads.value.filter((l) => l.status === 'active').length,
    rejected: leads.value.filter((l) => l.status === 'rejected').length,
  }))

  const allFilteredSelected = computed(() => {
    if (filteredLeads.value.length === 0) return false
    return filteredLeads.value.every((l) => selectedIds.value.has(l.id))
  })

  const hasSelection = computed(() => selectedIds.value.size > 0)

  // ============================================
  // DATA LOADING
  // ============================================
  async function fetchLeads() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('dealer_leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      leads.value = (data as unknown as DealerLead[]) || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAdminUsers() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'admin')

      adminUsers.value = (data as unknown as AdminUser[]) || []
    } catch {
      // Non-blocking: admin users list is optional
    }
  }

  onMounted(() => {
    fetchLeads()
    fetchAdminUsers()
  })

  // ============================================
  // ACTIONS
  // ============================================
  function toggleExpand(id: string) {
    if (expandedId.value === id) {
      expandedId.value = null
      editingNotes.value = ''
    } else {
      expandedId.value = id
      const lead = leads.value.find((l) => l.id === id)
      editingNotes.value = lead?.contact_notes || ''
    }
  }

  async function updateStatus(leadId: string, newStatus: string) {
    updatingStatus.value = leadId
    error.value = null

    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      // If moving to "contacted", set contacted_at timestamp
      if (newStatus === 'contacted') {
        updateData.contacted_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('dealer_leads')
        .update(updateData)
        .eq('id', leadId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      const lead = leads.value.find((l) => l.id === leadId)
      if (lead) {
        lead.status = newStatus as LeadStatus
        lead.updated_at = updateData.updated_at as string
        if (newStatus === 'contacted' && !lead.contacted_at) {
          lead.contacted_at = updateData.contacted_at as string
        }
      }

      showSuccess(t('admin.captacion.successUpdated'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      updatingStatus.value = null
    }
  }

  async function updateAssignment(leadId: string, userId: string | null) {
    updatingAssign.value = leadId
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('dealer_leads')
        .update({
          assigned_to: userId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      const lead = leads.value.find((l) => l.id === leadId)
      if (lead) {
        lead.assigned_to = userId || null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      updatingAssign.value = null
    }
  }

  async function saveNotes(leadId: string) {
    savingNotes.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('dealer_leads')
        .update({
          contact_notes: editingNotes.value.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      const lead = leads.value.find((l) => l.id === leadId)
      if (lead) {
        lead.contact_notes = editingNotes.value.trim() || null
      }

      showSuccess(t('admin.captacion.successUpdated'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      savingNotes.value = false
    }
  }

  // ============================================
  // BULK ACTIONS
  // ============================================
  function toggleSelectAll() {
    if (allFilteredSelected.value) {
      // Deselect all visible
      for (const lead of filteredLeads.value) {
        selectedIds.value.delete(lead.id)
      }
    } else {
      // Select all visible
      for (const lead of filteredLeads.value) {
        selectedIds.value.add(lead.id)
      }
    }
    // Force reactivity
    selectedIds.value = new Set(selectedIds.value)
  }

  function toggleSelect(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
    selectedIds.value = new Set(selectedIds.value)
  }

  async function bulkMarkContacted() {
    if (selectedIds.value.size === 0) return

    bulkProcessing.value = true
    error.value = null

    const ids = [...selectedIds.value]
    const now = new Date().toISOString()

    try {
      const { error: updateError } = await supabase
        .from('dealer_leads')
        .update({
          status: 'contacted',
          contacted_at: now,
          updated_at: now,
        })
        .in('id', ids)

      if (updateError) {
        error.value = t('admin.captacion.errorBulk')
        return
      }

      // Update local state
      for (const lead of leads.value) {
        if (ids.includes(lead.id)) {
          lead.status = 'contacted'
          lead.contacted_at = now
          lead.updated_at = now
        }
      }

      showSuccess(t('admin.captacion.successBulk', { count: ids.length }))
      selectedIds.value = new Set()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      bulkProcessing.value = false
    }
  }

  // ============================================
  // MANUAL LEAD FORM
  // ============================================
  function resetManualForm() {
    manualForm.value = {
      company_name: '',
      phone: '',
      email: '',
      location: '',
      active_listings: 0,
      vehicle_types: '',
      source_url: '',
    }
    showManualForm.value = false
  }

  async function saveManualLead() {
    if (!manualForm.value.company_name.trim()) return

    manualFormSaving.value = true
    error.value = null

    try {
      const vehicleTypesArr = manualForm.value.vehicle_types
        .split(',')
        .map((vt) => vt.trim())
        .filter(Boolean)

      const { data, error: insertError } = await supabase
        .from('dealer_leads')
        .insert({
          vertical: getVerticalSlug(),
          source: 'manual',
          source_url: manualForm.value.source_url.trim() || null,
          company_name: manualForm.value.company_name.trim(),
          phone: manualForm.value.phone.trim() || null,
          email: manualForm.value.email.trim() || null,
          location: manualForm.value.location.trim() || null,
          active_listings: manualForm.value.active_listings || 0,
          vehicle_types: vehicleTypesArr,
          status: 'new',
        })
        .select()

      if (insertError) {
        error.value = t('admin.captacion.errorSave')
        return
      }

      if (data && data.length > 0) {
        leads.value.unshift(data[0] as unknown as DealerLead)
      }

      showSuccess(t('admin.captacion.successCreated'))
      resetManualForm()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      manualFormSaving.value = false
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  function showSuccess(message: string) {
    successMessage.value = message
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  function getSourceClass(source: string): string {
    const map: Record<string, string> = {
      mascus: 'source-mascus',
      europa_camiones: 'source-europa',
      milanuncios: 'source-milanuncios',
      autoline: 'source-autoline',
      manual: 'source-manual',
    }
    return map[source] || 'source-manual'
  }

  function getSourceLabel(source: string): string {
    const map: Record<string, string> = {
      mascus: t('admin.captacion.sourceMascus'),
      europa_camiones: t('admin.captacion.sourceEuropaCamiones'),
      milanuncios: t('admin.captacion.sourceMilanuncios'),
      autoline: t('admin.captacion.sourceAutoline'),
      manual: t('admin.captacion.sourceManual'),
    }
    return map[source] || source
  }

  function getStatusClass(status: string): string {
    const map: Record<string, string> = {
      new: 'status-new',
      contacted: 'status-contacted',
      interested: 'status-interested',
      onboarding: 'status-onboarding',
      active: 'status-active',
      rejected: 'status-rejected',
    }
    return map[status] || 'status-new'
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      new: t('admin.captacion.statusNew'),
      contacted: t('admin.captacion.statusContacted'),
      interested: t('admin.captacion.statusInterested'),
      onboarding: t('admin.captacion.statusOnboarding'),
      active: t('admin.captacion.statusActive'),
      rejected: t('admin.captacion.statusRejected'),
    }
    return map[status] || status
  }

  function getAssignedName(userId: string | null): string {
    if (!userId) return t('admin.captacion.unassigned')
    const user = adminUsers.value.find((u) => u.id === userId)
    return user?.full_name || user?.email || userId.slice(0, 8)
  }

  function formatVehicleTypes(types: string[]): string {
    if (!types || types.length === 0) return '-'
    return types.join(', ')
  }

  return {
    // State
    leads,
    adminUsers,
    loading,
    error,
    successMessage,
    activeTab,
    expandedId,
    editingNotes,
    savingNotes,
    updatingStatus,
    updatingAssign,
    selectedIds,
    bulkProcessing,
    showManualForm,
    manualFormSaving,
    manualForm,
    // Computed
    filteredLeads,
    stats,
    tabCounts,
    allFilteredSelected,
    hasSelection,
    // Data loading
    fetchLeads,
    fetchAdminUsers,
    // Actions
    toggleExpand,
    updateStatus,
    updateAssignment,
    saveNotes,
    toggleSelectAll,
    toggleSelect,
    bulkMarkContacted,
    resetManualForm,
    saveManualLead,
    // Helpers
    showSuccess,
    formatDate,
    getSourceClass,
    getSourceLabel,
    getStatusClass,
    getStatusLabel,
    getAssignedName,
    formatVehicleTypes,
  }
}
