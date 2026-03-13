<script setup lang="ts">
import { useSocialAdminUI } from '~/composables/admin/useSocialAdminUI'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

// Toggle between list view and calendar view
const pageView = ref<'list' | 'calendar'>('list')

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
        <!-- View toggle -->
        <div class="view-toggle" role="group" :aria-label="t('admin.social.calendar.calendarView')">
          <button
            class="btn-view-toggle"
            :class="{ 'btn-view-active': pageView === 'list' }"
            :aria-pressed="pageView === 'list'"
            @click="pageView = 'list'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            class="btn-view-toggle"
            :class="{ 'btn-view-active': pageView === 'calendar' }"
            :aria-pressed="pageView === 'calendar'"
            :title="t('admin.social.calendar.calendarView')"
            @click="pageView = 'calendar'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

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

    <!-- Calendar view -->
    <AdminSocialCalendar v-if="pageView === 'calendar'" />

    <!-- List view controls (only in list mode) -->
    <template v-if="pageView === 'list'">

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
    <div v-if="loading && filteredPosts.length === 0" class="loading-state" aria-busy="true">
      <UiSkeletonCard v-for="n in 4" :key="n" :image="true" :lines="2" />
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

    </template><!-- end list view -->

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
  gap: var(--spacing-4);
  height: 100%;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}
.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}
.header-actions {
  display: flex;
  gap: var(--spacing-2);
}

.count-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
}
.count-badge.pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.view-toggle {
  display: flex;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.btn-view-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.625rem;
  background: var(--bg-primary);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  min-height: 2.75rem;
  min-width: 2.75rem;
  transition: background 0.15s, color 0.15s;
}

.btn-view-toggle + .btn-view-toggle {
  border-left: 1px solid var(--color-gray-200);
}

.btn-view-toggle:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-view-active {
  background: var(--color-primary);
  color: #fff;
}

.btn-view-active:hover {
  background: var(--color-primary-dark);
  color: #fff;
}

.btn-generate {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.125rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 2.75rem;
  transition: background 0.2s;
}
.btn-generate:hover {
  background: var(--color-primary-dark);
}

.btn-refresh {
  padding: 0.625rem 1.125rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 2.75rem;
  transition: all 0.2s;
}
.btn-refresh:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}
.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toast-success {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  background: var(--color-success);
  color: white;
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--border-radius);
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
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.9rem;
}
.dismiss-btn {
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  padding: var(--spacing-1);
  display: flex;
  align-items: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}
.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
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
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
  gap: var(--spacing-3);
}
.empty-icon {
  margin-bottom: var(--spacing-1);
}
.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

@media (min-width: 48em) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 64em) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 80em) {
  .posts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
