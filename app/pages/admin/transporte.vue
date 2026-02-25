<script setup lang="ts">
import { formatPriceCents } from '~/composables/shared/useListingUtils'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()

// ============================================
// TYPES
// ============================================
interface VehicleInfo {
  title: string
  slug: string
}

interface TransportRequest {
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

type TabFilter = 'all' | 'pending' | 'inProgress' | 'completed' | 'cancelled'

const STATUS_OPTIONS = ['quoted', 'accepted', 'in_transit', 'completed', 'cancelled'] as const

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

onMounted(() => {
  fetchRequests()
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
</script>

<template>
  <div class="transporte-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('admin.transporte.title') }}</h1>
      <button class="btn-refresh" :disabled="loading" @click="fetchRequests">
        {{ t('admin.transporte.refresh') }}
      </button>
    </header>

    <!-- Stats cards -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">{{ t('admin.transporte.statsTotal') }}</span>
      </div>
      <div class="stat-card stat-pending">
        <span class="stat-value">{{ stats.pending }}</span>
        <span class="stat-label">{{ t('admin.transporte.statsPending') }}</span>
      </div>
      <div class="stat-card stat-transit">
        <span class="stat-value">{{ stats.inTransit }}</span>
        <span class="stat-label">{{ t('admin.transporte.statsInTransit') }}</span>
      </div>
      <div class="stat-card stat-completed">
        <span class="stat-value">{{ stats.completedThisMonth }}</span>
        <span class="stat-label">{{ t('admin.transporte.statsCompletedMonth') }}</span>
      </div>
    </div>

    <!-- Tab filters -->
    <div class="tabs-row">
      <button
        v-for="tab in ['all', 'pending', 'inProgress', 'completed', 'cancelled'] as TabFilter[]"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ t(`admin.transporte.${tab}`) }}
        <span class="tab-count">{{ tabCounts[tab] }}</span>
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
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredRequests.length === 0" class="empty-state">
      <p>{{ t('admin.transporte.noResults') }}</p>
    </div>

    <!-- Desktop table -->
    <div v-else class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('admin.transporte.colVehicle') }}</th>
            <th>{{ t('admin.transporte.colRequester') }}</th>
            <th>{{ t('admin.transporte.colOrigin') }}</th>
            <th>{{ t('admin.transporte.colDestination') }}</th>
            <th>{{ t('admin.transporte.colPrice') }}</th>
            <th>{{ t('admin.transporte.colStatus') }}</th>
            <th>{{ t('admin.transporte.colDate') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="req in filteredRequests" :key="req.id">
            <tr
              class="table-row"
              :class="{ expanded: expandedId === req.id }"
              @click="toggleExpand(req.id)"
            >
              <td class="cell-vehicle">{{ req.vehicles?.title || '-' }}</td>
              <td class="cell-requester">{{ req.user_id?.slice(0, 8) }}...</td>
              <td>{{ req.origin || '-' }}</td>
              <td>{{ req.destination_postal_code || '-' }}</td>
              <td>{{ formatPriceCents(req.estimated_price_cents) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(req.status)">
                  {{ getStatusLabel(req.status) }}
                </span>
              </td>
              <td>{{ formatDate(req.created_at) }}</td>
            </tr>
            <!-- Expanded row -->
            <tr v-if="expandedId === req.id" class="expanded-row">
              <td colspan="7">
                <div class="expanded-content">
                  <div class="expanded-field">
                    <label>{{ t('admin.transporte.status') }}</label>
                    <select
                      :value="req.status"
                      :disabled="updatingStatus === req.id"
                      @change="updateStatus(req.id, ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                        {{ getStatusLabel(opt) }}
                      </option>
                    </select>
                  </div>
                  <div class="expanded-field notes-field">
                    <label>{{ t('admin.transporte.adminNotes') }}</label>
                    <textarea
                      v-model="editingNotes"
                      rows="3"
                      :placeholder="t('admin.transporte.notesPlaceholder')"
                    />
                    <button
                      class="btn-save-notes"
                      :disabled="savingNotes"
                      @click.stop="saveNotes(req.id)"
                    >
                      {{ savingNotes ? t('admin.transporte.saving') : t('common.save') }}
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
    <div v-if="!loading && filteredRequests.length > 0" class="card-list mobile-only">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="request-card"
        :class="{ expanded: expandedId === req.id }"
      >
        <button class="card-header" @click="toggleExpand(req.id)">
          <div class="card-top">
            <span class="card-vehicle">{{ req.vehicles?.title || '-' }}</span>
            <span class="status-badge" :class="getStatusClass(req.status)">
              {{ getStatusLabel(req.status) }}
            </span>
          </div>
          <div class="card-details">
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.transporte.colOrigin') }}</span>
              <span class="detail-value">{{ req.origin || '-' }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.transporte.colDestination') }}</span>
              <span class="detail-value">{{ req.destination_postal_code || '-' }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.transporte.colPrice') }}</span>
              <span class="detail-value">{{ formatPriceCents(req.estimated_price_cents) }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.transporte.colDate') }}</span>
              <span class="detail-value">{{ formatDate(req.created_at) }}</span>
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
              :class="{ rotated: expandedId === req.id }"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        <!-- Expanded section -->
        <div v-if="expandedId === req.id" class="card-expanded">
          <div class="expanded-field">
            <label>{{ t('admin.transporte.colRequester') }}</label>
            <span>{{ req.user_id?.slice(0, 8) }}...</span>
          </div>
          <div class="expanded-field">
            <label>{{ t('admin.transporte.status') }}</label>
            <select
              :value="req.status"
              :disabled="updatingStatus === req.id"
              @change="updateStatus(req.id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                {{ getStatusLabel(opt) }}
              </option>
            </select>
          </div>
          <div class="expanded-field notes-field">
            <label>{{ t('admin.transporte.adminNotes') }}</label>
            <textarea
              v-model="editingNotes"
              rows="3"
              :placeholder="t('admin.transporte.notesPlaceholder')"
            />
            <button class="btn-save-notes" :disabled="savingNotes" @click="saveNotes(req.id)">
              {{ savingNotes ? t('admin.transporte.saving') : t('common.save') }}
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
.transporte-page {
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

.btn-refresh {
  align-self: flex-start;
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
  min-width: 140px;
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

.stat-card.stat-pending .stat-value {
  color: #d97706;
}

.stat-card.stat-transit .stat-value {
  color: #2563eb;
}

.stat-card.stat-completed .stat-value {
  color: #16a34a;
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

.dismiss-btn {
  background: none;
  border: none;
  color: #dc2626;
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

.status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-accepted {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.status-transit {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.status-completed {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-cancelled {
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

.cell-vehicle {
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-requester {
  font-family: monospace;
  font-size: 0.8rem;
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
  gap: 24px;
  flex-wrap: wrap;
  background: #f8fafc;
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

.request-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.request-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.request-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.card-vehicle {
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

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-refresh {
    align-self: auto;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }
}

@media (min-width: 1024px) {
  .stats-row {
    flex-wrap: nowrap;
  }
}
</style>
