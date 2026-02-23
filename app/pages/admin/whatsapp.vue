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
interface DealerInfo {
  company_name: Record<string, string> | null
  phone: string | null
  whatsapp: string | null
}

interface WhatsAppSubmission {
  id: string
  dealer_id: string | null
  sender_phone: string | null
  sender_name: string | null
  message_text: string | null
  image_urls: string[] | null
  extracted_data: Record<string, unknown> | null
  vehicle_id: string | null
  status: 'received' | 'processing' | 'processed' | 'published' | 'failed'
  error_message: string | null
  created_at: string
  updated_at: string | null
  dealers: DealerInfo | null
}

type StatusFilter = 'all' | 'received' | 'processing' | 'processed' | 'published' | 'failed'

// ============================================
// STATE
// ============================================
const submissions = ref<WhatsAppSubmission[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const statusFilter = ref<StatusFilter>('all')
const search = ref('')
const expandedId = ref<string | null>(null)
const actionLoading = ref(false)
const successMessage = ref<string | null>(null)
const page = ref(0)
const hasMore = ref(true)
const PAGE_SIZE = 20

// Delete confirmation
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<string | null>(null)

// ============================================
// COMPUTED
// ============================================
const filteredSubmissions = computed(() => {
  let result = submissions.value

  if (statusFilter.value !== 'all') {
    result = result.filter((s) => s.status === statusFilter.value)
  }

  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim()
    result = result.filter((s) => {
      const dealerName = s.sender_name?.toLowerCase() || ''
      const dealerPhone = s.sender_phone?.toLowerCase() || ''
      const companyName = s.dealers?.company_name
        ? Object.values(s.dealers.company_name).join(' ').toLowerCase()
        : ''
      return dealerName.includes(q) || dealerPhone.includes(q) || companyName.includes(q)
    })
  }

  return result
})

const statusCounts = computed(() => {
  const all = submissions.value
  return {
    all: all.length,
    received: all.filter((s) => s.status === 'received').length,
    processing: all.filter((s) => s.status === 'processing').length,
    processed: all.filter((s) => s.status === 'processed').length,
    published: all.filter((s) => s.status === 'published').length,
    failed: all.filter((s) => s.status === 'failed').length,
  }
})

const pendingCount = computed(() => statusCounts.value.received + statusCounts.value.processing)

// ============================================
// DATA LOADING
// ============================================
async function fetchSubmissions(reset = true) {
  if (reset) {
    page.value = 0
    submissions.value = []
    hasMore.value = true
  }

  loading.value = true
  error.value = null

  try {
    const from = page.value * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error: fetchError } = await supabase
      .from('whatsapp_submissions')
      .select('*, dealers(company_name, phone, whatsapp)')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (fetchError) {
      error.value = fetchError.message
      return
    }

    const newItems = (data as unknown as WhatsAppSubmission[]) || []

    if (reset) {
      submissions.value = newItems
    } else {
      submissions.value = [...submissions.value, ...newItems]
    }

    hasMore.value = newItems.length === PAGE_SIZE
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  page.value++
  await fetchSubmissions(false)
}

onMounted(() => {
  fetchSubmissions()
})

// ============================================
// ACTIONS
// ============================================
function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function showSuccess(msg: string) {
  successMessage.value = msg
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

async function retryProcessing(submissionId: string) {
  actionLoading.value = true
  try {
    const response = await $fetch('/api/whatsapp/process', {
      method: 'POST',
      body: { submissionId },
    })

    if (response) {
      showSuccess(t('admin.whatsapp.retrySuccess'))
      await fetchSubmissions()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('admin.whatsapp.retryError')
  } finally {
    actionLoading.value = false
  }
}

async function publishVehicle(submission: WhatsAppSubmission) {
  if (!submission.vehicle_id) return

  actionLoading.value = true
  try {
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ status: 'active' })
      .eq('id', submission.vehicle_id)

    if (updateError) {
      error.value = updateError.message
      return
    }

    // Update submission status to published
    const { error: subError } = await supabase
      .from('whatsapp_submissions')
      .update({ status: 'published' })
      .eq('id', submission.id)

    if (subError) {
      error.value = subError.message
      return
    }

    showSuccess(t('admin.whatsapp.publishSuccess'))
    await fetchSubmissions()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    actionLoading.value = false
  }
}

function confirmDelete(id: string) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

async function executeDelete() {
  if (!deleteTargetId.value) return

  actionLoading.value = true
  try {
    const { error: deleteError } = await supabase
      .from('whatsapp_submissions')
      .delete()
      .eq('id', deleteTargetId.value)

    if (deleteError) {
      error.value = deleteError.message
      return
    }

    showSuccess(t('admin.whatsapp.deleteSuccess'))
    cancelDelete()
    expandedId.value = null
    await fetchSubmissions()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    actionLoading.value = false
  }
}

// ============================================
// HELPERS
// ============================================
function getDealerName(sub: WhatsAppSubmission): string {
  if (sub.sender_name) return sub.sender_name
  if (sub.dealers?.company_name) {
    const names = Object.values(sub.dealers.company_name)
    return names[0] || '-'
  }
  return '-'
}

function getDealerPhone(sub: WhatsAppSubmission): string {
  return sub.sender_phone || sub.dealers?.phone || sub.dealers?.whatsapp || '-'
}

function getTextPreview(sub: WhatsAppSubmission, maxLen = 100): string {
  const text = sub.message_text || ''
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function getImageCount(sub: WhatsAppSubmission): number {
  return sub.image_urls?.length || 0
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    received: 'status-received',
    processing: 'status-processing',
    processed: 'status-processed',
    published: 'status-published',
    failed: 'status-failed',
  }
  return classes[status] || 'status-received'
}

function getStatusLabel(status: string): string {
  return t(`admin.whatsapp.status.${status}`)
}
</script>

<template>
  <div class="whatsapp-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>{{ t('admin.whatsapp.title') }}</h1>
        <span v-if="pendingCount > 0" class="count-badge pending">
          {{ pendingCount }} {{ t('admin.whatsapp.pendingLabel') }}
        </span>
      </div>
      <button class="btn-refresh" :disabled="loading" @click="fetchSubmissions()">
        {{ t('admin.whatsapp.refresh') }}
      </button>
    </header>

    <!-- Success toast -->
    <Transition name="toast">
      <div v-if="successMessage" class="toast-success">
        {{ successMessage }}
      </div>
    </Transition>

    <!-- Stats cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ statusCounts.all }}</span>
        <span class="stat-label">{{ t('admin.whatsapp.stats.total') }}</span>
      </div>
      <div class="stat-card stat-pending">
        <span class="stat-value">{{ pendingCount }}</span>
        <span class="stat-label">{{ t('admin.whatsapp.stats.pending') }}</span>
      </div>
      <div class="stat-card stat-processed">
        <span class="stat-value">{{ statusCounts.processed }}</span>
        <span class="stat-label">{{ t('admin.whatsapp.stats.processed') }}</span>
      </div>
      <div class="stat-card stat-published">
        <span class="stat-value">{{ statusCounts.published }}</span>
        <span class="stat-label">{{ t('admin.whatsapp.stats.published') }}</span>
      </div>
      <div class="stat-card stat-failed">
        <span class="stat-value">{{ statusCounts.failed }}</span>
        <span class="stat-label">{{ t('admin.whatsapp.stats.failed') }}</span>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="filters-bar">
      <div class="status-pills">
        <button
          v-for="tab in [
            'all',
            'received',
            'processing',
            'processed',
            'published',
            'failed',
          ] as StatusFilter[]"
          :key="tab"
          class="status-pill"
          :class="{ active: statusFilter === tab }"
          @click="statusFilter = tab"
        >
          {{ t(`admin.whatsapp.tabs.${tab}`) }}
          <span class="pill-count">{{ statusCounts[tab] }}</span>
        </button>
      </div>
      <div class="search-box">
        <span class="search-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input v-model="search" type="text" :placeholder="t('admin.whatsapp.searchPlaceholder')" >
        <button v-if="search" class="clear-btn" @click="search = ''">
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

    <!-- Loading skeleton -->
    <div v-if="loading && submissions.length === 0" class="skeleton-list">
      <div v-for="i in 5" :key="i" class="skeleton-card">
        <div class="skeleton-avatar" />
        <div class="skeleton-lines">
          <div class="skeleton-line long" />
          <div class="skeleton-line short" />
        </div>
        <div class="skeleton-badge" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && filteredSubmissions.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          opacity="0.3"
        >
          <path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          />
        </svg>
      </div>
      <p>{{ t('admin.whatsapp.empty') }}</p>
      <button
        v-if="statusFilter !== 'all' || search"
        class="btn-secondary"
        @click="
          statusFilter = 'all'
          search = ''
        "
      >
        {{ t('admin.whatsapp.clearFilters') }}
      </button>
    </div>

    <!-- Submissions list -->
    <div v-else class="submissions-list">
      <div
        v-for="sub in filteredSubmissions"
        :key="sub.id"
        class="submission-item"
        :class="{ expanded: expandedId === sub.id }"
      >
        <!-- Row summary -->
        <button class="submission-row" @click="toggleExpand(sub.id)">
          <div class="sub-dealer">
            <div class="sub-avatar">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                />
              </svg>
            </div>
            <div class="sub-dealer-info">
              <strong>{{ getDealerName(sub) }}</strong>
              <span class="sub-phone">{{ getDealerPhone(sub) }}</span>
            </div>
          </div>
          <div class="sub-date-cell">
            {{ formatDate(sub.created_at) }}
          </div>
          <div class="sub-status-cell">
            <span class="status-badge" :class="getStatusClass(sub.status)">
              {{ getStatusLabel(sub.status) }}
            </span>
          </div>
          <div class="sub-preview-cell">
            <span class="sub-text-preview">{{ getTextPreview(sub) }}</span>
          </div>
          <div class="sub-images-cell">
            <span v-if="getImageCount(sub) > 0" class="image-count">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              {{ getImageCount(sub) }}
            </span>
          </div>
          <div class="sub-vehicle-link-cell">
            <NuxtLink
              v-if="sub.vehicle_id && (sub.status === 'processed' || sub.status === 'published')"
              :to="`/admin/productos/${sub.vehicle_id}`"
              class="vehicle-link"
              @click.stop
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </NuxtLink>
          </div>
          <div class="sub-expand-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :class="{ rotated: expandedId === sub.id }"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        <!-- Expanded detail -->
        <div v-if="expandedId === sub.id" class="submission-detail">
          <!-- Full text content -->
          <div class="detail-section">
            <h4>{{ t('admin.whatsapp.messageContent') }}</h4>
            <div class="message-content">
              {{ sub.message_text || t('admin.whatsapp.noMessage') }}
            </div>
          </div>

          <!-- Extracted data -->
          <div
            v-if="sub.extracted_data && Object.keys(sub.extracted_data).length > 0"
            class="detail-section"
          >
            <h4>{{ t('admin.whatsapp.extractedData') }}</h4>
            <dl class="data-list">
              <div v-for="(value, key) in sub.extracted_data" :key="String(key)" class="data-row">
                <dt>{{ String(key) }}</dt>
                <dd>{{ String(value) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Image thumbnails -->
          <div v-if="sub.image_urls && sub.image_urls.length > 0" class="detail-section">
            <h4>{{ t('admin.whatsapp.images') }} ({{ sub.image_urls.length }})</h4>
            <div class="image-grid">
              <a
                v-for="(url, idx) in sub.image_urls"
                :key="idx"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="image-thumb"
              >
                <img :src="url" :alt="`${t('admin.whatsapp.image')} ${idx + 1}`" >
              </a>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="sub.error_message" class="detail-section">
            <h4>{{ t('admin.whatsapp.errorDetail') }}</h4>
            <div class="error-content">
              {{ sub.error_message }}
            </div>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <button
              v-if="sub.status === 'failed' || sub.status === 'received'"
              class="btn-retry"
              :disabled="actionLoading"
              @click="retryProcessing(sub.id)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              {{ t('admin.whatsapp.retry') }}
            </button>
            <NuxtLink
              v-if="sub.vehicle_id && (sub.status === 'processed' || sub.status === 'published')"
              :to="`/admin/productos/${sub.vehicle_id}`"
              class="btn-view"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {{ t('admin.whatsapp.viewVehicle') }}
            </NuxtLink>
            <button
              v-if="sub.status === 'processed' && sub.vehicle_id"
              class="btn-publish"
              :disabled="actionLoading"
              @click="publishVehicle(sub)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ t('admin.whatsapp.publish') }}
            </button>
            <button class="btn-delete" :disabled="actionLoading" @click="confirmDelete(sub.id)">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                />
              </svg>
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !loading" class="load-more">
        <button class="btn-load-more" @click="loadMore">
          {{ t('admin.whatsapp.loadMore') }}
        </button>
      </div>
      <div v-if="loading && submissions.length > 0" class="loading-more">
        <div class="spinner small" />
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-panel">
            <div class="modal-header">
              <h2>{{ t('admin.whatsapp.confirmDeleteTitle') }}</h2>
              <button class="modal-close" @click="cancelDelete">
                <svg
                  width="20"
                  height="20"
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
            <div class="modal-body">
              <p>{{ t('admin.whatsapp.confirmDeleteText') }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-confirm-delete" :disabled="actionLoading" @click="executeDelete">
                {{ t('common.delete') }}
              </button>
              <button class="btn-cancel" @click="cancelDelete">
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.whatsapp-page {
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
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.count-badge.pending {
  background: #fef3c7;
  color: #92400e;
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
   TOAST
   ============================================ */
.toast-success {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #16a34a;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ============================================
   STATS GRID
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-align: center;
}

.stat-pending .stat-value {
  color: #d97706;
}
.stat-processed .stat-value {
  color: #2563eb;
}
.stat-published .stat-value {
  color: #16a34a;
}
.stat-failed .stat-value {
  color: #dc2626;
}

/* ============================================
   FILTERS BAR
   ============================================ */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.status-pills {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow-x: auto;
  min-width: max-content;
  -webkit-overflow-scrolling: touch;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  min-height: 44px;
  white-space: nowrap;
}

.status-pill:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.status-pill.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.pill-count {
  font-size: 0.7rem;
  opacity: 0.7;
}

.status-pill.active .pill-count {
  opacity: 0.9;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.search-box input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.search-box .clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.search-box .clear-btn:hover {
  background: #cbd5e1;
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

/* ============================================
   SKELETON LOADING
   ============================================ */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line.long {
  width: 70%;
}

.skeleton-line.short {
  width: 40%;
}

.skeleton-badge {
  width: 60px;
  height: 24px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #64748b;
  gap: 12px;
}

.empty-icon {
  margin-bottom: 4px;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* ============================================
   SUBMISSIONS LIST
   ============================================ */
.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.submission-item {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.submission-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.submission-item.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Row summary */
.submission-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  min-height: 64px;
  font-family: inherit;
}

.submission-row:hover {
  background: #f8fafc;
}

/* Dealer info cell */
.sub-dealer {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.sub-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #16a34a;
}

.sub-dealer-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sub-dealer-info strong {
  font-size: 0.9rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-phone {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Date cell */
.sub-date-cell {
  display: none;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
}

/* Status cell */
.sub-status-cell {
  display: flex;
  align-items: center;
}

/* Preview cell */
.sub-preview-cell {
  display: none;
  min-width: 0;
  flex: 1;
}

.sub-text-preview {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Images cell */
.sub-images-cell {
  display: none;
}

.image-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

/* Vehicle link cell */
.sub-vehicle-link-cell {
  display: flex;
  align-items: center;
}

.vehicle-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  color: var(--color-primary, #23424a);
  transition: background 0.15s;
}

.vehicle-link:hover {
  background: rgba(35, 66, 74, 0.08);
}

/* Expand icon */
.sub-expand-icon {
  display: flex;
  align-items: center;
  color: #94a3b8;
}

.sub-expand-icon svg {
  transition: transform 0.2s;
}

.sub-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-received {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-processing {
  background: #fef3c7;
  color: #92400e;
}

.status-processed {
  background: #e0e7ff;
  color: #4338ca;
}

.status-published {
  background: #dcfce7;
  color: #16a34a;
}

.status-failed {
  background: #fee2e2;
  color: #dc2626;
}

/* ============================================
   EXPANDED DETAIL VIEW
   ============================================ */
.submission-detail {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.message-content {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Extracted data */
.data-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.data-row:last-child {
  border-bottom: none;
}

.data-row dt {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  flex-shrink: 0;
  text-transform: capitalize;
}

.data-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 500;
  text-align: right;
}

/* Image grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.image-thumb {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: block;
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-thumb:hover {
  border-color: var(--color-primary, #23424a);
}

/* Error content */
.error-content {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #dc2626;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Detail actions */
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.btn-retry,
.btn-view,
.btn-publish,
.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  min-height: 44px;
  text-decoration: none;
}

.btn-retry {
  background: #475569;
  color: white;
}

.btn-retry:hover {
  background: #334155;
}

.btn-view {
  background: var(--color-primary, #23424a);
  color: white;
}

.btn-view:hover {
  background: #1a3238;
}

.btn-publish {
  background: #16a34a;
  color: white;
}

.btn-publish:hover {
  background: #15803d;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
}

.btn-retry:disabled,
.btn-publish:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   LOAD MORE
   ============================================ */
.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.btn-load-more {
  padding: 12px 32px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.15s;
}

.btn-load-more:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.small {
  width: 18px;
  height: 18px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   DELETE CONFIRMATION MODAL
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9000;
  padding: 0;
}

.modal-panel {
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-body p {
  margin: 0;
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-confirm-delete,
.btn-cancel {
  flex: 1;
  min-width: 100px;
  min-height: 44px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.btn-confirm-delete {
  background: #dc2626;
  color: white;
}

.btn-confirm-delete:hover {
  background: #b91c1c;
}

.btn-confirm-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  transform: translateY(100%);
}

.modal-leave-to .modal-panel {
  transform: translateY(100%);
}

/* ============================================
   RESPONSIVE — Mobile-first, breakpoints up
   ============================================ */

/* 480px+ */
@media (min-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .sub-images-cell {
    display: flex;
    align-items: center;
  }

  .image-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 768px+ : Tablet — switch to table layout */
@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-refresh {
    align-self: auto;
  }

  .stats-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .filters-bar {
    flex-direction: row;
    align-items: center;
  }

  .search-box {
    max-width: 280px;
  }

  .sub-date-cell {
    display: block;
  }

  .sub-preview-cell {
    display: block;
  }

  /* Modal: centered */
  .modal-overlay {
    align-items: center;
    padding: 20px;
  }

  .modal-panel {
    border-radius: 16px;
    max-width: 480px;
  }

  .image-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* 1024px+ : Desktop */
@media (min-width: 1024px) {
  .sub-images-cell {
    display: flex;
  }

  .detail-actions {
    flex-wrap: nowrap;
  }

  .btn-retry,
  .btn-view,
  .btn-publish,
  .btn-delete {
    flex: none;
    padding: 10px 20px;
  }

  .image-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 1280px+ : Wide desktop */
@media (min-width: 1280px) {
  .image-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}
</style>
