<script setup lang="ts">
import { useAdminWhatsApp } from '~/composables/admin/useAdminWhatsApp'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  // State
  submissions,
  loading,
  error,
  statusFilter,
  search,
  expandedId,
  actionLoading,
  successMessage,
  hasMore,
  showDeleteConfirm,

  // Computed
  filteredSubmissions,
  statusCounts,
  pendingCount,

  // Filters
  clearFilters,

  // Data loading
  fetchSubmissions,
  loadMore,

  // Actions
  toggleExpand,
  retryProcessing,
  publishVehicle,
  confirmDelete,
  cancelDelete,
  executeDelete,

  // Helpers
  getDealerName,
  getDealerPhone,
  getTextPreview,
  getImageCount,
  formatDate,
  getStatusClass,
  getStatusLabel,
} = useAdminWhatsApp()
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
    <AdminWhatsAppStats :status-counts="statusCounts" :pending-count="pendingCount" />

    <!-- Filters bar -->
    <AdminWhatsAppFilters
      v-model:status-filter="statusFilter"
      v-model:search="search"
      :status-counts="statusCounts"
      @clear-filters="clearFilters"
    />

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
      <button v-if="statusFilter !== 'all' || search" class="btn-secondary" @click="clearFilters()">
        {{ t('admin.whatsapp.clearFilters') }}
      </button>
    </div>

    <!-- Submissions list -->
    <div v-else class="submissions-list">
      <AdminWhatsAppSubmission
        v-for="sub in filteredSubmissions"
        :key="sub.id"
        :submission="sub"
        :expanded="expandedId === sub.id"
        :action-loading="actionLoading"
        :get-dealer-name="getDealerName"
        :get-dealer-phone="getDealerPhone"
        :get-text-preview="getTextPreview"
        :get-image-count="getImageCount"
        :format-date="formatDate"
        :get-status-class="getStatusClass"
        :get-status-label="getStatusLabel"
        @toggle="toggleExpand"
        @retry="retryProcessing"
        @publish="publishVehicle"
        @delete="confirmDelete"
      />

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
    <AdminWhatsAppDeleteModal
      :show="showDeleteConfirm"
      :action-loading="actionLoading"
      @confirm="executeDelete"
      @cancel="cancelDelete"
    />
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
  color: var(--text-primary);
}

.count-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.count-badge.pending {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.btn-refresh {
  align-self: flex-start;
  padding: 10px 18px;
  background: var(--color-primary);
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
  background: var(--color-primary-dark);
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
  background: var(--color-success);
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
   ALERTS & STATES
   ============================================ */
.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: var(--color-error);
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
  background: var(--bg-primary);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
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
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
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
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
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
  color: var(--text-auxiliary);
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
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

/* ============================================
   SUBMISSIONS LIST
   ============================================ */
.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.15s;
}

.btn-load-more:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
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
   RESPONSIVE — Mobile-first, breakpoints up
   ============================================ */

/* 768px+ : Tablet */
@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-refresh {
    align-self: auto;
  }
}
</style>
