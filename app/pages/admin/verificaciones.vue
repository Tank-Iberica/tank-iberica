<script setup lang="ts">
import { useAdminVerificaciones } from '~/composables/admin/useAdminVerificaciones'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()

const {
  // State
  documents,
  loading,
  error,
  search,
  statusFilter,
  expandedDocId,
  rejectionReason,
  actionLoading,
  // Computed
  filteredDocuments,
  pendingCount,
  statusCounts,
  vehicleVerificationMap,
  // Actions
  fetchDocuments,
  toggleExpand,
  approveDocument,
  rejectDocument,
  clearFilters,
  // Helpers
  getVehicleThumbnail,
  getDealerName,
  formatDate,
  getDocTypeLabel,
  getStatusClass,
  getStatusLabel,
  getVerificationLevelInfo,
  isFileImage,
} = useAdminVerificaciones()

onMounted(() => {
  fetchDocuments()
})
</script>

<template>
  <div class="verificaciones-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>{{ t('admin.verificaciones.title') }}</h1>
        <span v-if="pendingCount > 0" class="count-badge pending">
          {{ pendingCount }} {{ t('admin.verificaciones.pending') }}
        </span>
        <span v-else class="count-badge">
          {{ documents.length }}
        </span>
      </div>
      <button class="btn-refresh" :disabled="loading" @click="fetchDocuments">
        {{ t('admin.verificaciones.refresh') }}
      </button>
    </header>

    <!-- Filters bar -->
    <VerificacionFilters
      :status-filter="statusFilter"
      :status-counts="statusCounts"
      :search="search"
      :pending-count="pendingCount"
      @update:status-filter="statusFilter = $event"
      @update:search="search = $event"
      @clear="clearFilters"
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

    <!-- Loading -->
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard v-for="n in 4" :key="n" :lines="3" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredDocuments.length === 0" class="empty-state">
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
          <path d="M9 12l2 2 4-4" />
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        </svg>
      </div>
      <p>{{ t('admin.verificaciones.empty') }}</p>
      <button v-if="statusFilter !== 'all' || search" class="btn-secondary" @click="clearFilters()">
        {{ t('admin.verificaciones.clearFilters') }}
      </button>
    </div>

    <!-- Document queue -->
    <div v-else class="doc-queue">
      <!-- Per-vehicle verification level cards -->
      <VerificacionLevelGrid
        v-if="statusFilter === 'all'"
        :vehicle-verification-map="vehicleVerificationMap"
        :get-verification-level-info="getVerificationLevelInfo"
      />

      <!-- Document list -->
      <div class="doc-list">
        <VerificacionDocItem
          v-for="doc in filteredDocuments"
          :key="doc.id"
          :doc="doc"
          :expanded="expandedDocId === doc.id"
          :action-loading="actionLoading"
          :rejection-reason="rejectionReason"
          :get-vehicle-thumbnail="getVehicleThumbnail"
          :get-dealer-name="getDealerName"
          :format-date="formatDate"
          :get-doc-type-label="getDocTypeLabel"
          :get-status-class="getStatusClass"
          :get-status-label="getStatusLabel"
          :get-verification-level-info="getVerificationLevelInfo"
          :is-file-image="isFileImage"
          :vehicle-verification-map="vehicleVerificationMap"
          @toggle="toggleExpand"
          @approve="approveDocument"
          @reject="rejectDocument"
          @update:rejection-reason="rejectionReason = $event"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.verificaciones-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  height: 100%;
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  align-items: stretch;
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

.btn-refresh {
  align-self: flex-start;
  padding: 0.625rem 1.125rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
}

.btn-refresh:hover {
  background: var(--color-primary-dark);
}

.btn-refresh:disabled {
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
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
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

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

/* ============================================
   DOCUMENT QUEUE
   ============================================ */
.doc-queue {
  flex: 1;
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

/* ============================================
   RESPONSIVE
   ============================================ */

/* 768px+ : Tablet layout */
@media (min-width: 48em) {
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
