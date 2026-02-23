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
interface VehicleInfo {
  title: string
  slug: string
}

interface ServiceRequest {
  id: string
  user_id: string
  vehicle_id: string | null
  type: string
  status: string
  details: Record<string, unknown> | null
  partner_notified_at: string | null
  created_at: string
  updated_at: string | null
  vehicles: VehicleInfo | null
}

type TypeFilter = 'all' | 'transport' | 'transfer' | 'insurance' | 'inspection'
type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

const STATUS_OPTIONS: ServiceStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']

const TYPE_ICONS: Record<string, string> = {
  transport: '\uD83D\uDE9B',
  transfer: '\uD83D\uDCC4',
  insurance: '\uD83D\uDEE1',
  inspection: '\uD83D\uDD0D',
}

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

onMounted(() => {
  fetchRequests()
})

// ============================================
// ACTIONS
// ============================================
function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function updateStatus(requestId: string, newStatus: string) {
  updatingStatus.value = requestId
  try {
    const { error: updateError } = await supabase
      .from('service_requests')
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

async function notifyPartner(requestId: string) {
  notifyingPartner.value = requestId
  try {
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ partner_notified_at: now })
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
</script>

<template>
  <div class="servicios-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('admin.servicios.title') }}</h1>
      <button class="btn-refresh" :disabled="loading" @click="fetchRequests">
        {{ t('admin.servicios.refresh') }}
      </button>
    </header>

    <!-- Tab filters by type -->
    <div class="tabs-row">
      <button
        v-for="tab in ['all', 'transport', 'transfer', 'insurance', 'inspection'] as TypeFilter[]"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        <span v-if="tab !== 'all'" class="tab-icon">{{ getTypeIcon(tab) }}</span>
        {{ t(`admin.servicios.${tab}`) }}
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
      <p>{{ t('admin.servicios.noResults') }}</p>
    </div>

    <!-- Desktop table -->
    <div v-else class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('admin.servicios.colType') }}</th>
            <th>{{ t('admin.servicios.colVehicle') }}</th>
            <th>{{ t('admin.servicios.colRequester') }}</th>
            <th>{{ t('admin.servicios.colStatus') }}</th>
            <th>{{ t('admin.servicios.colDate') }}</th>
            <th>{{ t('admin.servicios.colPartnerNotified') }}</th>
            <th>{{ t('admin.servicios.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="req in filteredRequests" :key="req.id">
            <tr
              class="table-row"
              :class="{ expanded: expandedId === req.id }"
              @click="toggleExpand(req.id)"
            >
              <td class="cell-type">
                <span class="type-icon">{{ getTypeIcon(req.type) }}</span>
                <span class="type-label">{{ getTypeLabel(req.type) }}</span>
              </td>
              <td class="cell-vehicle">{{ req.vehicles?.title || '-' }}</td>
              <td class="cell-requester">{{ req.user_id?.slice(0, 8) }}...</td>
              <td>
                <span class="status-badge" :class="getStatusClass(req.status)">
                  {{ getStatusLabel(req.status) }}
                </span>
              </td>
              <td>{{ formatDate(req.created_at) }}</td>
              <td>
                <span v-if="req.partner_notified_at" class="partner-notified">
                  {{ formatDate(req.partner_notified_at) }}
                </span>
                <span v-else class="partner-pending">{{ t('admin.servicios.notNotified') }}</span>
              </td>
              <td @click.stop>
                <div class="table-actions">
                  <select
                    :value="req.status"
                    :disabled="updatingStatus === req.id"
                    class="status-select"
                    @change="updateStatus(req.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                      {{ getStatusLabel(opt) }}
                    </option>
                  </select>
                  <button
                    v-if="!req.partner_notified_at"
                    class="btn-notify"
                    :disabled="notifyingPartner === req.id"
                    @click="notifyPartner(req.id)"
                  >
                    {{ t('admin.servicios.notifyPartner') }}
                  </button>
                </div>
              </td>
            </tr>
            <!-- Expanded row with details -->
            <tr v-if="expandedId === req.id" class="expanded-row">
              <td colspan="7">
                <div class="expanded-content">
                  <h4>{{ t('admin.servicios.details') }}</h4>
                  <div
                    v-if="req.details && Object.keys(req.details).length > 0"
                    class="details-grid"
                  >
                    <div v-for="(value, key) in req.details" :key="String(key)" class="detail-item">
                      <span class="detail-key">{{ String(key) }}</span>
                      <span class="detail-val">{{ formatDetailValue(value) }}</span>
                    </div>
                  </div>
                  <p v-else class="no-details">{{ t('admin.servicios.noDetails') }}</p>
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
            <span class="card-type">
              <span class="type-icon">{{ getTypeIcon(req.type) }}</span>
              {{ getTypeLabel(req.type) }}
            </span>
            <span class="status-badge" :class="getStatusClass(req.status)">
              {{ getStatusLabel(req.status) }}
            </span>
          </div>
          <div class="card-details">
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.servicios.colVehicle') }}</span>
              <span class="detail-value">{{ req.vehicles?.title || '-' }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.servicios.colDate') }}</span>
              <span class="detail-value">{{ formatDate(req.created_at) }}</span>
            </div>
            <div class="card-detail">
              <span class="detail-label">{{ t('admin.servicios.colPartnerNotified') }}</span>
              <span class="detail-value">
                {{
                  req.partner_notified_at
                    ? formatDate(req.partner_notified_at)
                    : t('admin.servicios.notNotified')
                }}
              </span>
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
            <label>{{ t('admin.servicios.colRequester') }}</label>
            <span>{{ req.user_id?.slice(0, 8) }}...</span>
          </div>
          <div class="expanded-field">
            <label>{{ t('admin.servicios.colStatus') }}</label>
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
          <button
            v-if="!req.partner_notified_at"
            class="btn-notify"
            :disabled="notifyingPartner === req.id"
            @click="notifyPartner(req.id)"
          >
            {{ t('admin.servicios.notifyPartner') }}
          </button>
          <div v-if="req.details && Object.keys(req.details).length > 0" class="expanded-details">
            <h4>{{ t('admin.servicios.details') }}</h4>
            <div class="details-grid">
              <div v-for="(value, key) in req.details" :key="String(key)" class="detail-item">
                <span class="detail-key">{{ String(key) }}</span>
                <span class="detail-val">{{ formatDetailValue(value) }}</span>
              </div>
            </div>
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
.servicios-page {
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

.tab-icon {
  font-size: 1rem;
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

.status-badge.status-progress {
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
   PARTNER NOTIFICATION
   ============================================ */
.partner-notified {
  color: #16a34a;
  font-size: 0.85rem;
  font-weight: 500;
}

.partner-pending {
  color: #94a3b8;
  font-size: 0.85rem;
  font-style: italic;
}

.btn-notify {
  padding: 8px 14px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.btn-notify:hover {
  background: #1d4ed8;
}

.btn-notify:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.cell-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 1.1rem;
}

.type-label {
  font-weight: 500;
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

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
  min-height: 36px;
  background: white;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid #e2e8f0;
}

.expanded-content {
  padding: 16px;
  background: #f8fafc;
}

.expanded-content h4 {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-key {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  text-transform: capitalize;
}

.detail-val {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 500;
  text-align: right;
  word-break: break-word;
  max-width: 60%;
}

.no-details {
  margin: 0;
  color: #94a3b8;
  font-size: 0.9rem;
  font-style: italic;
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

.card-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
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
  width: 100%;
}

.expanded-field select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.expanded-details {
  margin-top: 8px;
}

.expanded-details h4 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
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

  .details-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .details-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
</style>
