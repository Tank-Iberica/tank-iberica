<script setup lang="ts">
import type { SocialPlatform, SocialPostWithVehicle } from '~/composables/useSocialPublisher'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const { locale } = useI18n()
const supabase = useSupabaseClient()

const {
  posts,
  loading,
  error,
  fetchPosts,
  approvePost,
  rejectPost,
  publishPost,
  updatePostContent,
  createPendingPosts,
} = useSocialPublisher()

// ============================================
// STATE
// ============================================
type StatusFilter = 'all' | 'pending' | 'approved' | 'posted' | 'rejected' | 'failed'

const statusFilter = ref<StatusFilter>('all')
const selectedPost = ref<SocialPostWithVehicle | null>(null)
const showModal = ref(false)
const showGenerateModal = ref(false)
const rejectionReason = ref('')
const editContent = ref('')
const editLocale = ref<'es' | 'en'>('es')
const actionLoading = ref(false)
const successMessage = ref<string | null>(null)

// Vehicle selector for generate
const vehicleSearch = ref('')
const vehicleResults = ref<
  {
    id: string
    brand: string
    model: string
    slug: string
    price: number | null
    location: string | null
    vehicle_images: { url: string }[]
  }[]
>([])
const selectedVehicle = ref<(typeof vehicleResults.value)[0] | null>(null)
const vehicleSearchLoading = ref(false)

// ============================================
// COMPUTED
// ============================================
const filteredPosts = computed(() => {
  if (statusFilter.value === 'all') return posts.value
  return posts.value.filter((p) => p.status === statusFilter.value)
})

const statusCounts = computed(() => {
  const all = posts.value
  return {
    all: all.length,
    pending: all.filter((p) => p.status === 'pending').length,
    approved: all.filter((p) => p.status === 'approved').length,
    posted: all.filter((p) => p.status === 'posted').length,
    rejected: all.filter((p) => p.status === 'rejected').length,
    failed: all.filter((p) => p.status === 'failed').length,
  }
})

// ============================================
// DATA LOADING
// ============================================
onMounted(async () => {
  await fetchPosts()
})

async function refreshPosts() {
  const filters: { status?: string } = {}
  if (statusFilter.value !== 'all') {
    filters.status = statusFilter.value
  }
  await fetchPosts(filters)
}

watch(statusFilter, () => {
  refreshPosts()
})

// ============================================
// ACTIONS
// ============================================
function openPostModal(post: SocialPostWithVehicle) {
  selectedPost.value = post
  editLocale.value = (locale.value as 'es' | 'en') || 'es'
  editContent.value = post.content?.[editLocale.value] || post.content?.es || ''
  rejectionReason.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedPost.value = null
  rejectionReason.value = ''
  editContent.value = ''
}

function showSuccess(msg: string) {
  successMessage.value = msg
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

async function handleApprove(postId: string) {
  actionLoading.value = true
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  const ok = await approvePost(postId, user.id)
  actionLoading.value = false
  if (ok) {
    showSuccess(t('admin.social.postApproved'))
    closeModal()
    await refreshPosts()
  }
}

async function handleReject(postId: string) {
  if (!rejectionReason.value.trim()) return
  actionLoading.value = true
  const ok = await rejectPost(postId, rejectionReason.value.trim())
  actionLoading.value = false
  if (ok) {
    showSuccess(t('admin.social.postRejected'))
    closeModal()
    await refreshPosts()
  }
}

async function handlePublish(postId: string) {
  actionLoading.value = true
  const ok = await publishPost(postId)
  actionLoading.value = false
  if (ok) {
    showSuccess(t('admin.social.postPublished'))
    closeModal()
    await refreshPosts()
  }
}

async function handleSaveContent() {
  if (!selectedPost.value) return
  actionLoading.value = true
  const newContent = { ...selectedPost.value.content, [editLocale.value]: editContent.value }
  const ok = await updatePostContent(selectedPost.value.id, newContent)
  actionLoading.value = false
  if (ok) {
    showSuccess(t('admin.social.contentSaved'))
    await refreshPosts()
  }
}

function switchEditLocale(loc: 'es' | 'en') {
  editLocale.value = loc
  if (selectedPost.value) {
    editContent.value = selectedPost.value.content?.[loc] || ''
  }
}

// ============================================
// GENERATE POSTS
// ============================================
function openGenerateModal() {
  showGenerateModal.value = true
  vehicleSearch.value = ''
  vehicleResults.value = []
  selectedVehicle.value = null
}

function closeGenerateModal() {
  showGenerateModal.value = false
  selectedVehicle.value = null
}

async function searchVehicles() {
  if (vehicleSearch.value.trim().length < 2) return
  vehicleSearchLoading.value = true
  try {
    const { data } = await supabase
      .from('vehicles')
      .select('id, brand, model, slug, price, location, vehicle_images(url)')
      .or(`brand.ilike.%${vehicleSearch.value}%,model.ilike.%${vehicleSearch.value}%`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)

    vehicleResults.value = (data as unknown as typeof vehicleResults.value) || []
  } finally {
    vehicleSearchLoading.value = false
  }
}

async function handleGeneratePosts() {
  if (!selectedVehicle.value) return
  actionLoading.value = true
  const v = selectedVehicle.value
  const ids = await createPendingPosts(v.id, {
    title: `${v.brand} ${v.model}`,
    price_cents: (v.price || 0) * 100,
    location: v.location || '',
    slug: v.slug,
    images: v.vehicle_images,
  })
  actionLoading.value = false
  if (ids.length > 0) {
    showSuccess(t('admin.social.postsGenerated', { count: ids.length }))
    closeGenerateModal()
    await refreshPosts()
  }
}

// ============================================
// HELPERS
// ============================================
function getVehicleTitle(post: SocialPostWithVehicle): string {
  if (!post.vehicles) return '-'
  return `${post.vehicles.brand} ${post.vehicles.model}`
}

function _getVehicleThumbnail(post: SocialPostWithVehicle): string | null {
  if (!post.vehicles?.vehicle_images?.length) return null
  const sorted = [...post.vehicles.vehicle_images].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  )
  return sorted[0]?.url || null
}

function truncateContent(post: SocialPostWithVehicle, maxLen: number = 100): string {
  const content = post.content?.[locale.value] || post.content?.es || ''
  if (content.length <= maxLen) return content
  return content.slice(0, maxLen) + '...'
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

function getPlatformLabel(platform: SocialPlatform): string {
  const labels: Record<SocialPlatform, string> = {
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X',
  }
  return labels[platform] || platform
}

function getPlatformClass(platform: SocialPlatform): string {
  return `platform-${platform}`
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    posted: 'status-posted',
    rejected: 'status-rejected',
    failed: 'status-failed',
    draft: 'status-pending',
  }
  return classes[status] || 'status-pending'
}

function getStatusLabel(status: string): string {
  const key = `admin.social.status.${status}`
  return t(key)
}
</script>

<template>
  <div class="social-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>{{ t('admin.social.title') }}</h1>
        <span v-if="statusCounts.pending > 0" class="count-badge pending">
          {{ statusCounts.pending }} {{ t('admin.social.pendingLabel') }}
        </span>
      </div>
      <div class="header-actions">
        <button class="btn-generate" @click="openGenerateModal">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {{ t('admin.social.generatePosts') }}
        </button>
        <button class="btn-refresh" :disabled="loading" @click="refreshPosts">
          {{ t('admin.social.refresh') }}
        </button>
      </div>
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
        <span class="stat-label">{{ t('admin.social.stats.total') }}</span>
      </div>
      <div class="stat-card stat-pending">
        <span class="stat-value">{{ statusCounts.pending }}</span>
        <span class="stat-label">{{ t('admin.social.stats.pending') }}</span>
      </div>
      <div class="stat-card stat-approved">
        <span class="stat-value">{{ statusCounts.approved }}</span>
        <span class="stat-label">{{ t('admin.social.stats.approved') }}</span>
      </div>
      <div class="stat-card stat-posted">
        <span class="stat-value">{{ statusCounts.posted }}</span>
        <span class="stat-label">{{ t('admin.social.stats.posted') }}</span>
      </div>
      <div class="stat-card stat-failed">
        <span class="stat-value">{{ statusCounts.failed }}</span>
        <span class="stat-label">{{ t('admin.social.stats.failed') }}</span>
      </div>
    </div>

    <!-- Tab filters -->
    <div class="filters-bar">
      <div class="status-pills">
        <button
          v-for="tab in [
            'all',
            'pending',
            'approved',
            'posted',
            'rejected',
            'failed',
          ] as StatusFilter[]"
          :key="tab"
          class="status-pill"
          :class="{ active: statusFilter === tab }"
          @click="statusFilter = tab"
        >
          {{ t(`admin.social.tabs.${tab}`) }}
          <span class="pill-count">{{ statusCounts[tab] }}</span>
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
      <button class="dismiss-btn" @click="() => {}">
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
    <div v-if="loading && filteredPosts.length === 0" class="loading-state">
      <div class="spinner" />
      <span>{{ t('admin.social.loading') }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredPosts.length === 0" class="empty-state">
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
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v-2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      </div>
      <p>{{ t('admin.social.noPosts') }}</p>
      <button class="btn-generate" @click="openGenerateModal">
        {{ t('admin.social.generatePosts') }}
      </button>
    </div>

    <!-- Post cards grid -->
    <div v-else class="posts-grid">
      <div
        v-for="post in filteredPosts"
        :key="post.id"
        class="post-card"
        @click="openPostModal(post)"
      >
        <!-- Image -->
        <div class="post-image">
          <img v-if="post.image_url" :src="post.image_url" :alt="getVehicleTitle(post)" >
          <div v-else class="post-image-placeholder">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              opacity="0.3"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <!-- Platform badge -->
          <span class="platform-badge" :class="getPlatformClass(post.platform)">
            {{ getPlatformLabel(post.platform) }}
          </span>
        </div>

        <!-- Content -->
        <div class="post-body">
          <div class="post-vehicle-title">{{ getVehicleTitle(post) }}</div>
          <p class="post-preview">{{ truncateContent(post) }}</p>
          <div class="post-meta">
            <span class="status-badge" :class="getStatusClass(post.status)">
              {{ getStatusLabel(post.status) }}
            </span>
            <span class="post-date">{{ formatDate(post.created_at) }}</span>
          </div>
          <!-- Metrics for published -->
          <div v-if="post.status === 'posted'" class="post-metrics">
            <span class="metric">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {{ post.impressions }}
            </span>
            <span class="metric">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              {{ post.clicks }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="post-actions">
          <button
            v-if="post.status === 'pending'"
            class="btn-action btn-approve"
            :title="t('admin.social.approve')"
            @click.stop="handleApprove(post.id)"
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
          </button>
          <button
            v-if="post.status === 'approved'"
            class="btn-action btn-publish"
            :title="t('admin.social.publish')"
            @click.stop="handlePublish(post.id)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
          <button
            class="btn-action btn-edit"
            :title="t('admin.social.edit')"
            @click.stop="openPostModal(post)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- POST DETAIL / EDIT MODAL -->
    <!-- ============================================ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal && selectedPost" class="modal-overlay" @click.self="closeModal">
          <div class="modal-panel">
            <div class="modal-header">
              <h2>{{ t('admin.social.postDetail') }}</h2>
              <button class="modal-close" @click="closeModal">
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
              <!-- Platform + Vehicle -->
              <div class="modal-meta">
                <span class="platform-badge large" :class="getPlatformClass(selectedPost.platform)">
                  {{ getPlatformLabel(selectedPost.platform) }}
                </span>
                <span class="modal-vehicle">{{ getVehicleTitle(selectedPost) }}</span>
                <span class="status-badge" :class="getStatusClass(selectedPost.status)">
                  {{ getStatusLabel(selectedPost.status) }}
                </span>
              </div>

              <!-- Image preview -->
              <div v-if="selectedPost.image_url" class="modal-image">
                <img :src="selectedPost.image_url" :alt="getVehicleTitle(selectedPost)" >
              </div>

              <!-- Locale tabs -->
              <div class="locale-tabs">
                <button
                  class="locale-tab"
                  :class="{ active: editLocale === 'es' }"
                  @click="switchEditLocale('es')"
                >
                  ES
                </button>
                <button
                  class="locale-tab"
                  :class="{ active: editLocale === 'en' }"
                  @click="switchEditLocale('en')"
                >
                  EN
                </button>
              </div>

              <!-- Content textarea -->
              <textarea
                v-model="editContent"
                class="content-textarea"
                rows="8"
                :disabled="selectedPost.status === 'posted'"
              />

              <!-- Status history -->
              <div class="status-history">
                <div class="history-item">
                  <span class="history-label">{{ t('admin.social.createdAt') }}:</span>
                  <span>{{ formatDate(selectedPost.created_at) }}</span>
                </div>
                <div v-if="selectedPost.approved_at" class="history-item">
                  <span class="history-label">{{ t('admin.social.approvedAt') }}:</span>
                  <span>{{ formatDate(selectedPost.approved_at) }}</span>
                </div>
                <div v-if="selectedPost.posted_at" class="history-item">
                  <span class="history-label">{{ t('admin.social.postedAt') }}:</span>
                  <span>{{ formatDate(selectedPost.posted_at) }}</span>
                </div>
                <div v-if="selectedPost.external_post_id" class="history-item">
                  <span class="history-label">{{ t('admin.social.externalId') }}:</span>
                  <span class="external-id">{{ selectedPost.external_post_id }}</span>
                </div>
                <div v-if="selectedPost.rejection_reason" class="history-item rejection">
                  <span class="history-label">{{ t('admin.social.rejectionReason') }}:</span>
                  <span>{{ selectedPost.rejection_reason }}</span>
                </div>
              </div>

              <!-- Metrics (published posts) -->
              <div v-if="selectedPost.status === 'posted'" class="modal-metrics">
                <div class="metric-card">
                  <span class="metric-value">{{ selectedPost.impressions }}</span>
                  <span class="metric-label">{{ t('admin.social.impressions') }}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-value">{{ selectedPost.clicks }}</span>
                  <span class="metric-label">{{ t('admin.social.clicks') }}</span>
                </div>
              </div>

              <!-- Rejection input (pending posts) -->
              <div v-if="selectedPost.status === 'pending'" class="rejection-input">
                <label>{{ t('admin.social.rejectionReasonLabel') }}</label>
                <input
                  v-model="rejectionReason"
                  type="text"
                  :placeholder="t('admin.social.rejectionReasonPlaceholder')"
                >
              </div>
            </div>

            <!-- Modal actions -->
            <div class="modal-footer">
              <!-- Save content -->
              <button
                v-if="selectedPost.status !== 'posted'"
                class="btn-save"
                :disabled="actionLoading"
                @click="handleSaveContent"
              >
                {{ t('admin.social.saveContent') }}
              </button>

              <!-- Approve -->
              <button
                v-if="selectedPost.status === 'pending'"
                class="btn-approve-lg"
                :disabled="actionLoading"
                @click="handleApprove(selectedPost.id)"
              >
                {{ t('admin.social.approve') }}
              </button>

              <!-- Reject -->
              <button
                v-if="selectedPost.status === 'pending'"
                class="btn-reject-lg"
                :disabled="actionLoading || !rejectionReason.trim()"
                @click="handleReject(selectedPost.id)"
              >
                {{ t('admin.social.reject') }}
              </button>

              <!-- Publish -->
              <button
                v-if="selectedPost.status === 'approved'"
                class="btn-publish-lg"
                :disabled="actionLoading"
                @click="handlePublish(selectedPost.id)"
              >
                {{ t('admin.social.publish') }}
              </button>

              <button class="btn-cancel" @click="closeModal">
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================ -->
    <!-- GENERATE POSTS MODAL -->
    <!-- ============================================ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showGenerateModal" class="modal-overlay" @click.self="closeGenerateModal">
          <div class="modal-panel modal-generate">
            <div class="modal-header">
              <h2>{{ t('admin.social.generatePosts') }}</h2>
              <button class="modal-close" @click="closeGenerateModal">
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
              <label class="form-label">{{ t('admin.social.selectVehicle') }}</label>
              <div class="search-row">
                <input
                  v-model="vehicleSearch"
                  type="text"
                  :placeholder="t('admin.social.vehicleSearchPlaceholder')"
                  class="search-input"
                  @input="searchVehicles"
                >
              </div>

              <!-- Vehicle results -->
              <div v-if="vehicleResults.length > 0" class="vehicle-list">
                <button
                  v-for="v in vehicleResults"
                  :key="v.id"
                  class="vehicle-option"
                  :class="{ selected: selectedVehicle?.id === v.id }"
                  @click="selectedVehicle = v"
                >
                  <img
                    v-if="v.vehicle_images?.[0]?.url"
                    :src="v.vehicle_images[0].url"
                    :alt="`${v.brand} ${v.model}`"
                    class="vehicle-thumb"
                  >
                  <div v-else class="vehicle-thumb-placeholder" />
                  <div class="vehicle-info">
                    <strong>{{ v.brand }} {{ v.model }}</strong>
                    <span v-if="v.location" class="vehicle-loc">{{ v.location }}</span>
                  </div>
                  <svg
                    v-if="selectedVehicle?.id === v.id"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="check-icon"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>

              <div v-if="vehicleSearchLoading" class="search-loading">
                <div class="spinner small" />
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="btn-generate-confirm"
                :disabled="!selectedVehicle || actionLoading"
                @click="handleGeneratePosts"
              >
                {{
                  actionLoading
                    ? t('admin.social.generating')
                    : t('admin.social.generateForAllPlatforms')
                }}
              </button>
              <button class="btn-cancel" @click="closeGenerateModal">
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
.social-page {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-generate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-generate:hover {
  background: #1a3238;
}

.btn-refresh {
  padding: 10px 18px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
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
.stat-approved .stat-value {
  color: #2563eb;
}
.stat-posted .stat-value {
  color: #16a34a;
}
.stat-failed .stat-value {
  color: #ea580c;
}

/* ============================================
   FILTERS BAR
   ============================================ */
.filters-bar {
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.status-pills {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  min-width: max-content;
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

/* ============================================
   POSTS GRID
   ============================================ */
.posts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.post-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Post image */
.post-image {
  position: relative;
  width: 100%;
  height: 160px;
  background: #f1f5f9;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Platform badges */
.platform-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.post-image .platform-badge {
  position: absolute;
  top: 8px;
  left: 8px;
}

.platform-badge.large {
  padding: 6px 14px;
  font-size: 0.85rem;
}

.platform-linkedin {
  background: #0a66c2;
}

.platform-facebook {
  background: #1877f2;
}

.platform-instagram {
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
}

.platform-x {
  background: #000;
}

/* Post body */
.post-body {
  padding: 12px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-vehicle-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.post-preview {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
}

.post-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.post-metrics {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-posted {
  background: #dcfce7;
  color: #16a34a;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.status-failed {
  background: #ffedd5;
  color: #c2410c;
}

/* Post actions */
.post-actions {
  display: flex;
  gap: 4px;
  padding: 8px 16px 12px;
  border-top: 1px solid #f1f5f9;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  color: #64748b;
}

.btn-action:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-action.btn-approve {
  color: #16a34a;
  border-color: #bbf7d0;
}

.btn-action.btn-approve:hover {
  background: #f0fdf4;
}

.btn-action.btn-publish {
  color: #2563eb;
  border-color: #bfdbfe;
}

.btn-action.btn-publish:hover {
  background: #eff6ff;
}

.btn-action.btn-edit {
  color: #64748b;
}

/* ============================================
   MODAL
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

.modal-generate {
  max-height: 80vh;
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-vehicle {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.modal-image {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.modal-image img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

/* Locale tabs */
.locale-tabs {
  display: flex;
  gap: 4px;
}

.locale-tab {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-weight: 600;
  font-size: 0.8rem;
  color: #64748b;
  cursor: pointer;
  min-height: 44px;
}

.locale-tab.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

/* Content textarea */
.content-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

.content-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.content-textarea:disabled {
  background: #f8fafc;
  color: #64748b;
}

/* Status history */
.status-history {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.history-item {
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
  color: #475569;
}

.history-label {
  font-weight: 600;
  white-space: nowrap;
}

.history-item.rejection {
  color: #dc2626;
}

.external-id {
  font-family: monospace;
  font-size: 0.75rem;
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Modal metrics */
.modal-metrics {
  display: flex;
  gap: 12px;
}

.metric-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
}

/* Rejection input */
.rejection-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rejection-input label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.rejection-input input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.rejection-input input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Modal footer */
.modal-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-save,
.btn-approve-lg,
.btn-reject-lg,
.btn-publish-lg,
.btn-generate-confirm,
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

.btn-save {
  background: #475569;
  color: white;
}

.btn-save:hover {
  background: #334155;
}

.btn-approve-lg {
  background: #16a34a;
  color: white;
}

.btn-approve-lg:hover {
  background: #15803d;
}

.btn-reject-lg {
  background: #dc2626;
  color: white;
}

.btn-reject-lg:hover {
  background: #b91c1c;
}

.btn-publish-lg {
  background: #2563eb;
  color: white;
}

.btn-publish-lg:hover {
  background: #1d4ed8;
}

.btn-generate-confirm {
  background: var(--color-primary, #23424a);
  color: white;
}

.btn-generate-confirm:hover {
  background: #1a3238;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-save:disabled,
.btn-approve-lg:disabled,
.btn-reject-lg:disabled,
.btn-publish-lg:disabled,
.btn-generate-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
   GENERATE MODAL — Vehicle search
   ============================================ */
.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.search-row {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.vehicle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  text-align: left;
  width: 100%;
  min-height: 56px;
  transition: all 0.15s;
}

.vehicle-option:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.vehicle-option.selected {
  border-color: var(--color-primary, #23424a);
  background: rgba(35, 66, 74, 0.04);
}

.vehicle-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.vehicle-thumb-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  background: #f1f5f9;
  flex-shrink: 0;
}

.vehicle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.vehicle-info strong {
  font-size: 0.9rem;
  color: #1e293b;
}

.vehicle-loc {
  font-size: 0.8rem;
  color: #64748b;
}

.check-icon {
  color: var(--color-primary, #23424a);
  flex-shrink: 0;
}

.search-loading {
  display: flex;
  justify-content: center;
  padding: 12px;
}

/* ============================================
   RESPONSIVE — Mobile-first, breakpoints up
   ============================================ */

/* 480px+ */
@media (min-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 768px+ : Tablet */
@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .stats-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Modal: centered */
  .modal-overlay {
    align-items: center;
    padding: 20px;
  }

  .modal-panel {
    border-radius: 16px;
    max-width: 600px;
  }
}

/* 1024px+ : Desktop */
@media (min-width: 1024px) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .modal-panel {
    max-width: 680px;
  }
}

/* 1280px+ : Wide desktop */
@media (min-width: 1280px) {
  .posts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
