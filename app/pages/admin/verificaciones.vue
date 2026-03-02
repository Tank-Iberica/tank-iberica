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
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('admin.verificaciones.loading') }}</span>
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

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
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
   DOCUMENT QUEUE
   ============================================ */
.doc-queue {
  flex: 1;
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ============================================
   RESPONSIVE
   ============================================ */

/* 768px+ : Tablet layout */
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
