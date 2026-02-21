<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()

// Types
type ReportStatus = 'pending' | 'reviewing' | 'resolved_removed' | 'resolved_kept'

interface Report {
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

// State
const reports = ref<Report[]>([])
const loading = ref(true)
const activeFilter = ref<ReportStatus | 'all'>('all')
const expandedId = ref<string | null>(null)
const savingId = ref<string | null>(null)
const editNotes = ref<Record<string, string>>({})

const filters: Array<{ value: ReportStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'report.admin.filterAll' },
  { value: 'pending', labelKey: 'report.admin.filterPending' },
  { value: 'reviewing', labelKey: 'report.admin.filterReviewing' },
  { value: 'resolved_removed', labelKey: 'report.admin.filterResolvedRemoved' },
  { value: 'resolved_kept', labelKey: 'report.admin.filterResolvedKept' },
]

const statusColors: Record<ReportStatus, string> = {
  pending: '#f59e0b',
  reviewing: '#3b82f6',
  resolved_removed: '#ef4444',
  resolved_kept: '#22c55e',
}

const statusLabels: Record<ReportStatus, string> = {
  pending: 'report.admin.statusPending',
  reviewing: 'report.admin.statusReviewing',
  resolved_removed: 'report.admin.statusResolvedRemoved',
  resolved_kept: 'report.admin.statusResolvedKept',
}

// Load reports
async function loadReports() {
  loading.value = true
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false })

  if (activeFilter.value !== 'all') {
    query = query.eq('status', activeFilter.value)
  }

  const { data } = await query
  reports.value = (data as Report[] | null) ?? []
  loading.value = false
}

// Update report status
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

// Save admin notes
async function saveNotes(reportId: string) {
  const notes = editNotes.value[reportId] ?? ''
  savingId.value = reportId
  await supabase.from('reports').update({ admin_notes: notes }).eq('id', reportId)

  // Update locally
  const idx = reports.value.findIndex((r) => r.id === reportId)
  if (idx !== -1) {
    reports.value[idx] = { ...reports.value[idx], admin_notes: notes }
  }
  savingId.value = null
}

// Toggle expand
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

// Format date
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Truncate email for display
function truncateEmail(email: string): string {
  if (email.length <= 24) return email
  const atIndex = email.indexOf('@')
  if (atIndex > 12) {
    return email.substring(0, 10) + '...' + email.substring(atIndex)
  }
  return email
}

// Pending count for badge
const pendingCount = computed(() => {
  return reports.value.filter((r) => r.status === 'pending').length
})

onMounted(loadReports)
watch(activeFilter, loadReports)
</script>

<template>
  <div class="admin-reportes">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>{{ t('report.admin.title') }}</h2>
        <span v-if="!loading" class="total-badge">{{ reports.length }} total</span>
        <span v-if="pendingCount > 0 && activeFilter === 'all'" class="pending-badge">
          {{ pendingCount }} {{ t('report.admin.filterPending') }}
        </span>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="filters-bar">
      <div class="filter-group status-filter">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ t(f.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('report.admin.loading') }}</span>
    </div>

    <!-- Reports list -->
    <div v-else-if="reports.length > 0" class="reports-list">
      <div
        v-for="report in reports"
        :key="report.id"
        class="report-card"
        :class="{
          'report-pending': report.status === 'pending',
          'report-expanded': expandedId === report.id,
        }"
      >
        <!-- Card header (clickable) -->
        <div class="report-header" @click="toggleExpand(report.id)">
          <div class="report-main-info">
            <div class="report-top-row">
              <span class="reporter-email" :title="report.reporter_email">
                {{ truncateEmail(report.reporter_email) }}
              </span>
              <span
                class="status-badge"
                :style="{
                  backgroundColor: statusColors[report.status] + '1a',
                  color: statusColors[report.status],
                  borderColor: statusColors[report.status] + '40',
                }"
              >
                {{ t(statusLabels[report.status]) }}
              </span>
            </div>
            <div class="report-meta-row">
              <span class="entity-badge">
                {{ report.entity_type }}
              </span>
              <span class="reason-text">
                {{ t(`report.reasons.${report.reason}`, report.reason) }}
              </span>
              <span class="report-date">
                {{ formatDate(report.created_at) }}
              </span>
            </div>
          </div>
          <div class="expand-indicator">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :class="{ rotated: expandedId === report.id }"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <!-- Expanded details -->
        <div v-if="expandedId === report.id" class="report-details">
          <!-- Details section -->
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">{{ t('report.admin.reporter') }}</span>
              <span class="detail-value">{{ report.reporter_email }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ t('report.admin.entityType') }}</span>
              <span class="detail-value">{{ report.entity_type }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Entity ID</span>
              <span class="detail-value detail-id">{{ report.entity_id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ t('report.admin.reason') }}</span>
              <span class="detail-value">{{
                t(`report.reasons.${report.reason}`, report.reason)
              }}</span>
            </div>
            <div v-if="report.details" class="detail-item detail-full">
              <span class="detail-label">{{ t('report.admin.details') }}</span>
              <span class="detail-value">{{ report.details }}</span>
            </div>
            <div v-if="report.resolved_at" class="detail-item">
              <span class="detail-label">{{ t('report.admin.resolvedAt') }}</span>
              <span class="detail-value">{{ formatDate(report.resolved_at) }}</span>
            </div>
          </div>

          <!-- Admin notes -->
          <div class="notes-section">
            <label class="notes-label">{{ t('report.admin.notes') }}</label>
            <textarea
              v-model="editNotes[report.id]"
              class="notes-textarea"
              rows="3"
              :placeholder="t('report.admin.notesPlaceholder')"
            />
            <button
              class="btn-save-notes"
              :disabled="savingId === report.id"
              @click="saveNotes(report.id)"
            >
              {{ savingId === report.id ? '...' : t('report.admin.saveNotes') }}
            </button>
          </div>

          <!-- Actions -->
          <div class="report-actions">
            <button
              v-if="report.status !== 'reviewing'"
              class="action-btn action-reviewing"
              :disabled="savingId === report.id"
              @click="updateStatus(report.id, 'reviewing')"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {{ t('report.admin.markReviewing') }}
            </button>
            <button
              v-if="!report.status.startsWith('resolved')"
              class="action-btn action-remove"
              :disabled="savingId === report.id"
              @click="updateStatus(report.id, 'resolved_removed')"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
              {{ t('report.admin.resolveRemove') }}
            </button>
            <button
              v-if="!report.status.startsWith('resolved')"
              class="action-btn action-keep"
              :disabled="savingId === report.id"
              @click="updateStatus(report.id, 'resolved_kept')"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ t('report.admin.resolveKeep') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state-container">
      <div class="empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <h3 class="empty-title">{{ t('report.admin.noReports') }}</h3>
      <p class="empty-description">
        {{
          activeFilter !== 'all'
            ? t('report.admin.noReportsFiltered')
            : t('report.admin.noReportsYet')
        }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.admin-reportes {
  padding: 0;
}

/* ============================================
   HEADER
   ============================================ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.pending-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* ============================================
   FILTERS
   ============================================ */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-btn {
  padding: 8px 14px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition:
    background 0.2s,
    color 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}

/* ============================================
   LOADING
   ============================================ */
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

/* ============================================
   REPORTS LIST
   ============================================ */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
  overflow: hidden;
}

.report-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.report-card.report-pending {
  border-left: 3px solid #f59e0b;
}

.report-card.report-expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ============================================
   CARD HEADER
   ============================================ */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  gap: 12px;
}

.report-header:hover {
  background: #fafafa;
}

.report-main-info {
  flex: 1;
  min-width: 0;
}

.report-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.reporter-email {
  font-weight: 600;
  font-size: 0.9rem;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid;
}

.report-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.entity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: #eff6ff;
  color: #1d4ed8;
}

.reason-text {
  font-size: 0.8rem;
  color: #6b7280;
}

.report-date {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
}

.expand-indicator {
  flex-shrink: 0;
  color: #9ca3af;
  transition: color 0.2s;
}

.expand-indicator svg {
  transition: transform 0.2s;
}

.expand-indicator svg.rotated {
  transform: rotate(180deg);
}

.report-header:hover .expand-indicator {
  color: #6b7280;
}

/* ============================================
   EXPANDED DETAILS
   ============================================ */
.report-details {
  padding: 0 20px 20px;
  border-top: 1px solid #f3f4f6;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 16px 0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item.detail-full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 0.9rem;
  color: #374151;
  word-break: break-word;
}

.detail-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: #6b7280;
}

/* ============================================
   ADMIN NOTES
   ============================================ */
.notes-section {
  padding: 16px 0;
  border-top: 1px solid #f3f4f6;
}

.notes-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.notes-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  color: #374151;
  line-height: 1.5;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-save-notes {
  margin-top: 8px;
  padding: 8px 16px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid var(--color-primary, #23424a);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-save-notes:hover:not(:disabled) {
  background: #f0f4f5;
}

.btn-save-notes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   ACTIONS
   ============================================ */
.report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.2s,
    border-color 0.2s;
  min-height: 44px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-reviewing {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.action-reviewing:hover:not(:disabled) {
  background: #dbeafe;
}

.action-remove {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.action-remove:hover:not(:disabled) {
  background: #fee2e2;
}

.action-keep {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

.action-keep:hover:not(:disabled) {
  background: #dcfce7;
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-state-container {
  background: white;
  border-radius: 8px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #374151;
}

.empty-description {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */

/* Base (mobile 360px+) is already the default layout above */

@media (min-width: 480px) {
  .report-actions {
    flex-wrap: nowrap;
  }

  .reporter-email {
    max-width: 280px;
  }
}

@media (min-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }

  .report-header {
    padding: 16px 24px;
  }

  .report-details {
    padding: 0 24px 24px;
  }

  .reporter-email {
    max-width: 360px;
  }

  .section-header {
    flex-direction: row;
  }
}

@media (min-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .report-card {
    padding: 0;
  }

  .report-actions {
    gap: 10px;
  }
}
</style>
