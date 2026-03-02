<script setup lang="ts">
import { useAdminTransporte } from '~/composables/admin/useAdminTransporte'
import TransporteStats from '~/components/admin/transporte/TransporteStats.vue'
import TransporteTabs from '~/components/admin/transporte/TransporteTabs.vue'
import TransporteTable from '~/components/admin/transporte/TransporteTable.vue'
import TransporteCards from '~/components/admin/transporte/TransporteCards.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  // State
  loading,
  error,
  activeTab,
  expandedId,
  editingNotes,
  savingNotes,
  updatingStatus,
  // Computed
  filteredRequests,
  stats,
  tabCounts,
  // Data loading
  fetchRequests,
  // Actions
  toggleExpand,
  updateStatus,
  saveNotes,
  // Helpers
  formatDate,
  getStatusClass,
  getStatusLabel,
  // Init
  init,
} = useAdminTransporte()

onMounted(() => {
  init()
})
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
    <TransporteStats :stats="stats" />

    <!-- Tab filters -->
    <TransporteTabs
      :active-tab="activeTab"
      :tab-counts="tabCounts"
      @update:active-tab="activeTab = $event"
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
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredRequests.length === 0" class="empty-state">
      <p>{{ t('admin.transporte.noResults') }}</p>
    </div>

    <!-- Desktop table -->
    <TransporteTable
      v-else
      :requests="filteredRequests"
      :expanded-id="expandedId"
      :editing-notes="editingNotes"
      :saving-notes="savingNotes"
      :updating-status="updatingStatus"
      :get-status-class="getStatusClass"
      :get-status-label="getStatusLabel"
      :format-date="formatDate"
      @toggle-expand="toggleExpand"
      @update-status="updateStatus"
      @save-notes="saveNotes"
      @update:editing-notes="editingNotes = $event"
    />

    <!-- Mobile card list -->
    <TransporteCards
      v-if="!loading && filteredRequests.length > 0"
      :requests="filteredRequests"
      :expanded-id="expandedId"
      :editing-notes="editingNotes"
      :saving-notes="savingNotes"
      :updating-status="updatingStatus"
      :get-status-class="getStatusClass"
      :get-status-label="getStatusLabel"
      :format-date="formatDate"
      @toggle-expand="toggleExpand"
      @update-status="updateStatus"
      @save-notes="saveNotes"
      @update:editing-notes="editingNotes = $event"
    />
  </div>
</template>

<style scoped>
.transporte-page {
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

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
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
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

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
