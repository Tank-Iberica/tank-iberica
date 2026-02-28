<script setup lang="ts">
import { useSocialAdminUI } from '~/composables/admin/useSocialAdminUI'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  // State
  statusFilter,
  selectedPost,
  showModal,
  showGenerateModal,
  rejectionReason,
  editContent,
  editLocale,
  actionLoading,
  successMessage,
  vehicleSearch,
  vehicleResults,
  selectedVehicle,
  vehicleSearchLoading,
  // From useSocialPublisher
  loading,
  error,
  // Computed
  filteredPosts,
  statusCounts,
  // Data loading
  fetchPosts,
  refreshPosts,
  // Actions
  openPostModal,
  closeModal,
  handleApprove,
  handleReject,
  handlePublish,
  handleSaveContent,
  switchEditLocale,
  // Generate
  openGenerateModal,
  closeGenerateModal,
  searchVehicles,
  handleGeneratePosts,
  // Helpers
  getVehicleTitle,
  truncateContent,
  formatDate,
  getPlatformLabel,
  getPlatformClass,
  getStatusClass,
  getStatusLabel,
} = useSocialAdminUI()

onMounted(async () => {
  await fetchPosts()
})

watch(statusFilter, () => {
  refreshPosts()
})
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
      <div v-if="successMessage" class="toast-success">{{ successMessage }}</div>
    </Transition>

    <!-- Stats cards -->
    <AdminSocialStatsCards :counts="statusCounts" />

    <!-- Tab filters -->
    <AdminSocialStatusTabs v-model="statusFilter" :counts="statusCounts" />

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
      <AdminSocialPostCard
        v-for="post in filteredPosts"
        :key="post.id"
        :post="post"
        :vehicle-title="getVehicleTitle(post)"
        :preview="truncateContent(post)"
        :platform-label="getPlatformLabel(post.platform)"
        :platform-class="getPlatformClass(post.platform)"
        :status-class="getStatusClass(post.status)"
        :status-label="getStatusLabel(post.status)"
        :formatted-date="formatDate(post.created_at)"
        @select="openPostModal"
        @approve="handleApprove"
        @publish="handlePublish"
      />
    </div>

    <!-- Post Detail / Edit Modal -->
    <AdminSocialPostDetailModal
      :show="showModal"
      :post="selectedPost"
      :vehicle-title="selectedPost ? getVehicleTitle(selectedPost) : ''"
      :platform-label="selectedPost ? getPlatformLabel(selectedPost.platform) : ''"
      :platform-class="selectedPost ? getPlatformClass(selectedPost.platform) : ''"
      :status-class="selectedPost ? getStatusClass(selectedPost.status) : ''"
      :status-label="selectedPost ? getStatusLabel(selectedPost.status) : ''"
      :edit-locale="editLocale"
      :edit-content="editContent"
      :rejection-reason="rejectionReason"
      :action-loading="actionLoading"
      :format-date="formatDate"
      @close="closeModal"
      @switch-locale="switchEditLocale"
      @update:edit-content="editContent = $event"
      @update:rejection-reason="rejectionReason = $event"
      @save-content="handleSaveContent"
      @approve="handleApprove"
      @reject="handleReject"
      @publish="handlePublish"
    />

    <!-- Generate Posts Modal -->
    <AdminSocialGenerateModal
      :show="showGenerateModal"
      :vehicle-search="vehicleSearch"
      :vehicle-results="vehicleResults"
      :selected-vehicle-id="selectedVehicle?.id ?? null"
      :has-selected-vehicle="!!selectedVehicle"
      :vehicle-search-loading="vehicleSearchLoading"
      :action-loading="actionLoading"
      @close="closeGenerateModal"
      @update:vehicle-search="vehicleSearch = $event"
      @search="searchVehicles"
      @select-vehicle="selectedVehicle = $event"
      @generate="handleGeneratePosts"
    />
  </div>
</template>

<style scoped>
.social-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

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
.header-actions {
  display: flex;
  gap: 8px;
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
  gap: 12px;
}
.empty-icon {
  margin-bottom: 4px;
}
.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1280px) {
  .posts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
