<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()

// ============================================
// TYPES
// ============================================
interface DealerLead {
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

interface AdminUser {
  id: string
  email: string
  full_name: string | null
}

type LeadStatus = 'new' | 'contacted' | 'interested' | 'onboarding' | 'active' | 'rejected'
type TabFilter = 'all' | 'new' | 'contacted' | 'interested' | 'onboarding' | 'active' | 'rejected'

const STATUS_OPTIONS: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'onboarding',
  'active',
  'rejected',
]

const _SOURCE_LIST = ['mascus', 'europa_camiones', 'milanuncios', 'autoline', 'manual'] as const

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
</script>

<template>
  <div class="captacion-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('admin.captacion.title') }}</h1>
      <div class="header-actions">
        <button class="btn-add" @click="showManualForm = !showManualForm">
          {{ t('admin.captacion.addManual') }}
        </button>
        <button class="btn-refresh" :disabled="loading" @click="fetchLeads">
          {{ t('admin.captacion.refresh') }}
        </button>
      </div>
    </header>

    <!-- Stats cards -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">{{ t('admin.captacion.totalLeads') }}</span>
      </div>
      <div class="stat-card stat-new">
        <span class="stat-value">{{ stats.new }}</span>
        <span class="stat-label">{{ t('admin.captacion.newCount') }}</span>
      </div>
      <div class="stat-card stat-contacted">
        <span class="stat-value">{{ stats.contacted }}</span>
        <span class="stat-label">{{ t('admin.captacion.contactedCount') }}</span>
      </div>
      <div class="stat-card stat-interested">
        <span class="stat-value">{{ stats.interested }}</span>
        <span class="stat-label">{{ t('admin.captacion.interestedCount') }}</span>
      </div>
      <div class="stat-card stat-active">
        <span class="stat-value">{{ stats.active }}</span>
        <span class="stat-label">{{ t('admin.captacion.activeCount') }}</span>
      </div>
    </div>

    <!-- Manual lead form (inline) -->
    <div v-if="showManualForm" class="manual-form-card">
      <div class="form-grid">
        <div class="form-field">
          <label>{{ t('admin.captacion.companyName') }} *</label>
          <input
            v-model="manualForm.company_name"
            type="text"
            :placeholder="t('admin.captacion.companyName')"
          >
        </div>
        <div class="form-field">
          <label>{{ t('admin.captacion.phone') }}</label>
          <input v-model="manualForm.phone" type="tel" :placeholder="t('admin.captacion.phone')" >
        </div>
        <div class="form-field">
          <label>{{ t('admin.captacion.email') }}</label>
          <input
            v-model="manualForm.email"
            type="email"
            :placeholder="t('admin.captacion.email')"
          >
        </div>
        <div class="form-field">
          <label>{{ t('admin.captacion.location') }}</label>
          <input
            v-model="manualForm.location"
            type="text"
            :placeholder="t('admin.captacion.location')"
          >
        </div>
        <div class="form-field">
          <label>{{ t('admin.captacion.formListings') }}</label>
          <input v-model.number="manualForm.active_listings" type="number" min="0" >
        </div>
        <div class="form-field">
          <label>{{ t('admin.captacion.formVehicleTypes') }}</label>
          <input
            v-model="manualForm.vehicle_types"
            type="text"
            :placeholder="t('admin.captacion.formVehicleTypes')"
          >
        </div>
        <div class="form-field form-field-wide">
          <label>{{ t('admin.captacion.formSourceUrl') }}</label>
          <input
            v-model="manualForm.source_url"
            type="url"
            :placeholder="t('admin.captacion.formSourceUrl')"
          >
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-cancel" :disabled="manualFormSaving" @click="resetManualForm">
          {{ t('admin.captacion.cancel') }}
        </button>
        <button
          class="btn-save"
          :disabled="manualFormSaving || !manualForm.company_name.trim()"
          @click="saveManualLead"
        >
          {{ manualFormSaving ? t('admin.captacion.formSaving') : t('admin.captacion.save') }}
        </button>
      </div>
    </div>

    <!-- Tab filters -->
    <div class="tabs-row">
      <button
        v-for="tab in [
          'all',
          'new',
          'contacted',
          'interested',
          'onboarding',
          'active',
          'rejected',
        ] as TabFilter[]"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ t(`admin.captacion.${tab}`) }}
        <span class="tab-count">{{ tabCounts[tab] }}</span>
      </button>
    </div>

    <!-- Bulk actions bar -->
    <div v-if="hasSelection" class="bulk-bar">
      <span class="bulk-count">{{
        t('admin.captacion.selectedCount', { count: selectedIds.size })
      }}</span>
      <button class="btn-bulk" :disabled="bulkProcessing" @click="bulkMarkContacted">
        {{ t('admin.captacion.bulkContact') }}
      </button>
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="alert-success">
      {{ successMessage }}
      <button class="dismiss-btn" @click="successMessage = null">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
      <button class="dismiss-btn" @click="error = null">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('admin.captacion.loading') }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredLeads.length === 0" class="empty-state">
      <p>{{ t('admin.captacion.noLeads') }}</p>
    </div>

    <!-- Desktop table -->
    <div v-else class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" :checked="allFilteredSelected" @change="toggleSelectAll" >
            </th>
            <th>{{ t('admin.captacion.company') }}</th>
            <th>{{ t('admin.captacion.source') }}</th>
            <th>{{ t('admin.captacion.location') }}</th>
            <th>{{ t('admin.captacion.activeListings') }}</th>
            <th>{{ t('admin.captacion.vehicleTypes') }}</th>
            <th>{{ t('admin.captacion.status') }}</th>
            <th>{{ t('admin.captacion.assignedTo') }}</th>
            <th>{{ t('admin.captacion.date') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="lead in filteredLeads" :key="lead.id">
            <tr
              class="table-row"
              :class="{ expanded: expandedId === lead.id, selected: selectedIds.has(lead.id) }"
              @click="toggleExpand(lead.id)"
            >
              <td class="col-check" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.has(lead.id)"
                  @change="toggleSelect(lead.id)"
                >
              </td>
              <td class="cell-company">{{ lead.company_name }}</td>
              <td>
                <span class="source-badge" :class="getSourceClass(lead.source)">
                  {{ getSourceLabel(lead.source) }}
                </span>
              </td>
              <td>{{ lead.location || '-' }}</td>
              <td class="cell-listings">{{ lead.active_listings }}</td>
              <td class="cell-types">{{ formatVehicleTypes(lead.vehicle_types) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(lead.status)">
                  {{ getStatusLabel(lead.status) }}
                </span>
              </td>
              <td class="cell-assigned">{{ getAssignedName(lead.assigned_to) }}</td>
              <td>{{ formatDate(lead.created_at) }}</td>
            </tr>
            <!-- Expanded row -->
            <tr v-if="expandedId === lead.id" class="expanded-row">
              <td colspan="9">
                <div class="expanded-content">
                  <!-- Status + Assign -->
                  <div class="expanded-row-top">
                    <div class="expanded-field">
                      <label>{{ t('admin.captacion.changeStatus') }}</label>
                      <select
                        :value="lead.status"
                        :disabled="updatingStatus === lead.id"
                        @change="updateStatus(lead.id, ($event.target as HTMLSelectElement).value)"
                      >
                        <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                          {{ getStatusLabel(opt) }}
                        </option>
                      </select>
                    </div>
                    <div class="expanded-field">
                      <label>{{ t('admin.captacion.assignTo') }}</label>
                      <select
                        :value="lead.assigned_to || ''"
                        :disabled="updatingAssign === lead.id"
                        @change="
                          updateAssignment(
                            lead.id,
                            ($event.target as HTMLSelectElement).value || null,
                          )
                        "
                      >
                        <option value="">{{ t('admin.captacion.unassigned') }}</option>
                        <option v-for="admin in adminUsers" :key="admin.id" :value="admin.id">
                          {{ admin.full_name || admin.email }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Contact info -->
                  <div class="expanded-row-contact">
                    <div class="contact-item">
                      <label>{{ t('admin.captacion.phone') }}</label>
                      <a v-if="lead.phone" :href="`tel:${lead.phone}`" class="contact-link">{{
                        lead.phone
                      }}</a>
                      <span v-else class="contact-empty">{{ t('admin.captacion.noPhone') }}</span>
                    </div>
                    <div class="contact-item">
                      <label>{{ t('admin.captacion.email') }}</label>
                      <a v-if="lead.email" :href="`mailto:${lead.email}`" class="contact-link">{{
                        lead.email
                      }}</a>
                      <span v-else class="contact-empty">{{ t('admin.captacion.noEmail') }}</span>
                    </div>
                    <div v-if="lead.source_url" class="contact-item">
                      <label>{{ t('admin.captacion.sourceUrl') }}</label>
                      <a
                        :href="lead.source_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="contact-link"
                        >{{ t('admin.captacion.visitSource') }}</a
                      >
                    </div>
                    <div v-if="lead.contacted_at" class="contact-item">
                      <label>{{ t('admin.captacion.contactedAt') }}</label>
                      <span>{{ formatDate(lead.contacted_at) }}</span>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div class="expanded-field notes-field">
                    <label>{{ t('admin.captacion.contactNotes') }}</label>
                    <textarea
                      v-model="editingNotes"
                      rows="3"
                      :placeholder="t('admin.captacion.notesPlaceholder')"
                    />
                    <button
                      class="btn-save-notes"
                      :disabled="savingNotes"
                      @click.stop="saveNotes(lead.id)"
                    >
                      {{
                        savingNotes ? t('admin.captacion.saving') : t('admin.captacion.saveNotes')
                      }}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Mobile card list -->
    <div v-if="!loading && filteredLeads.length > 0" class="card-list mobile-only">
      <div
        v-for="lead in filteredLeads"
        :key="lead.id"
        class="lead-card"
        :class="{ expanded: expandedId === lead.id, selected: selectedIds.has(lead.id) }"
      >
        <button class="card-header" @click="toggleExpand(lead.id)">
          <div class="card-top">
            <div class="card-top-left">
              <input
                type="checkbox"
                :checked="selectedIds.has(lead.id)"
                class="card-checkbox"
                @click.stop
                @change.stop="toggleSelect(lead.id)"
              >
              <span class="card-company">{{ lead.company_name }}</span>
            </div>
            <span class="status-badge" :class="getStatusClass(lead.status)">
              {{ getStatusLabel(lead.status) }}
            </span>
          </div>
          <div class="card-details">
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.captacion.source') }}</span>
              <span class="source-badge small" :class="getSourceClass(lead.source)">
                {{ getSourceLabel(lead.source) }}
              </span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.captacion.location') }}</span>
              <span class="detail-value">{{ lead.location || '-' }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.captacion.activeListings') }}</span>
              <span class="detail-value">{{ lead.active_listings }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.captacion.date') }}</span>
              <span class="detail-value">{{ formatDate(lead.created_at) }}</span>
            </div>
          </div>
          <div class="card-expand-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :class="{ rotated: expandedId === lead.id }"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        <!-- Expanded section -->
        <div v-if="expandedId === lead.id" class="card-expanded">
          <div class="expanded-field">
            <label>{{ t('admin.captacion.changeStatus') }}</label>
            <select
              :value="lead.status"
              :disabled="updatingStatus === lead.id"
              @change="updateStatus(lead.id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                {{ getStatusLabel(opt) }}
              </option>
            </select>
          </div>
          <div class="expanded-field">
            <label>{{ t('admin.captacion.assignTo') }}</label>
            <select
              :value="lead.assigned_to || ''"
              :disabled="updatingAssign === lead.id"
              @change="
                updateAssignment(lead.id, ($event.target as HTMLSelectElement).value || null)
              "
            >
              <option value="">{{ t('admin.captacion.unassigned') }}</option>
              <option v-for="admin in adminUsers" :key="admin.id" :value="admin.id">
                {{ admin.full_name || admin.email }}
              </option>
            </select>
          </div>

          <!-- Contact info -->
          <div class="card-contact-section">
            <div class="contact-item">
              <label>{{ t('admin.captacion.phone') }}</label>
              <a v-if="lead.phone" :href="`tel:${lead.phone}`" class="contact-link">{{
                lead.phone
              }}</a>
              <span v-else class="contact-empty">{{ t('admin.captacion.noPhone') }}</span>
            </div>
            <div class="contact-item">
              <label>{{ t('admin.captacion.email') }}</label>
              <a v-if="lead.email" :href="`mailto:${lead.email}`" class="contact-link">{{
                lead.email
              }}</a>
              <span v-else class="contact-empty">{{ t('admin.captacion.noEmail') }}</span>
            </div>
            <div v-if="lead.source_url" class="contact-item">
              <label>{{ t('admin.captacion.sourceUrl') }}</label>
              <a
                :href="lead.source_url"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-link"
                >{{ t('admin.captacion.visitSource') }}</a
              >
            </div>
            <div v-if="lead.contacted_at" class="contact-item">
              <label>{{ t('admin.captacion.contactedAt') }}</label>
              <span>{{ formatDate(lead.contacted_at) }}</span>
            </div>
          </div>

          <!-- Vehicle types -->
          <div v-if="lead.vehicle_types && lead.vehicle_types.length > 0" class="expanded-field">
            <label>{{ t('admin.captacion.vehicleTypes') }}</label>
            <span>{{ formatVehicleTypes(lead.vehicle_types) }}</span>
          </div>

          <!-- Notes -->
          <div class="expanded-field notes-field">
            <label>{{ t('admin.captacion.contactNotes') }}</label>
            <textarea
              v-model="editingNotes"
              rows="3"
              :placeholder="t('admin.captacion.notesPlaceholder')"
            />
            <button class="btn-save-notes" :disabled="savingNotes" @click="saveNotes(lead.id)">
              {{ savingNotes ? t('admin.captacion.saving') : t('admin.captacion.saveNotes') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.captacion-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-refresh {
  padding: 10px 18px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-refresh:hover {
  background: #1a3238;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add {
  padding: 10px 18px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-add:hover {
  background: #1d4ed8;
}

/* ============================================
   STATS CARDS
   ============================================ */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-card {
  flex: 1;
  min-width: 120px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.stat-card.stat-new .stat-value {
  color: #2563eb;
}

.stat-card.stat-contacted .stat-value {
  color: #d97706;
}

.stat-card.stat-interested .stat-value {
  color: #16a34a;
}

.stat-card.stat-active .stat-value {
  color: #059669;
}

/* ============================================
   MANUAL LEAD FORM
   ============================================ */
.manual-form-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
  border: 2px solid #dbeafe;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.form-field input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  min-height: 44px;
  background: white;
}

.form-field input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 18px;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.btn-cancel:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-save {
  padding: 10px 18px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-save:hover {
  background: #1a3238;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   TAB FILTERS
   ============================================ */
.tabs-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.tabs-row::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  min-height: 44px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.tab-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.tab-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.tab-btn.active .tab-count {
  opacity: 0.9;
}

/* ============================================
   BULK ACTIONS BAR
   ============================================ */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.bulk-count {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1d4ed8;
}

.btn-bulk {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.btn-bulk:hover {
  background: #1d4ed8;
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   ALERTS & STATES
   ============================================ */
.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.alert-success {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* ============================================
   SOURCE BADGES
   ============================================ */
.source-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.source-badge.small {
  padding: 2px 8px;
  font-size: 0.72rem;
}

.source-badge.source-mascus {
  background: #dbeafe;
  color: #1d4ed8;
}

.source-badge.source-europa {
  background: #dcfce7;
  color: #16a34a;
}

.source-badge.source-milanuncios {
  background: #fff7ed;
  color: #c2410c;
}

.source-badge.source-autoline {
  background: #f3e8ff;
  color: #7c3aed;
}

.source-badge.source-manual {
  background: #f1f5f9;
  color: #64748b;
}

/* ============================================
   STATUS BADGES
   ============================================ */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-new {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.status-contacted {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-interested {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-onboarding {
  background: #cffafe;
  color: #0e7490;
}

.status-badge.status-active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

/* ============================================
   DESKTOP TABLE
   ============================================ */
.desktop-only {
  display: none;
}

.table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
}

.col-check {
  width: 40px;
  text-align: center;
}

.col-check input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row.expanded {
  background: #f1f5f9;
}

.table-row.selected {
  background: #eff6ff;
}

.cell-company {
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-listings {
  font-weight: 600;
  text-align: center;
}

.cell-types {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85rem;
  color: #64748b;
}

.cell-assigned {
  font-size: 0.85rem;
  color: #64748b;
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid #e2e8f0;
}

.expanded-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
}

.expanded-row-top {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.expanded-row-contact {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.contact-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.contact-link:hover {
  text-decoration: underline;
}

.contact-empty {
  color: #94a3b8;
  font-size: 0.85rem;
  font-style: italic;
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.expanded-field select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
  background: white;
  cursor: pointer;
}

.expanded-field select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.notes-field {
  flex: 1;
  min-width: 240px;
}

.notes-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.notes-field textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-save-notes {
  align-self: flex-start;
  padding: 8px 16px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
  margin-top: 8px;
}

.btn-save-notes:hover {
  background: #1a3238;
}

.btn-save-notes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   MOBILE CARD LIST
   ============================================ */
.mobile-only {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lead-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.lead-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.lead-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.lead-card.selected {
  border: 2px solid #2563eb;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  min-height: 44px;
}

.card-header:hover {
  background: #f8fafc;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.card-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
  flex-shrink: 0;
}

.card-company {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.detail-value {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-expand-icon {
  display: flex;
  justify-content: center;
  color: #94a3b8;
}

.card-expand-icon svg {
  transition: transform 0.2s;
}

.card-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* Card expanded section */
.card-expanded {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

.card-expanded .expanded-field select {
  width: 100%;
}

.card-expanded .notes-field textarea {
  width: 100%;
}

.card-contact-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .form-field-wide {
    grid-column: 1 / -1;
  }
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .stats-row {
    flex-wrap: nowrap;
  }
}
</style>
