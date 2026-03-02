<script setup lang="ts">
import { useAdminServicios, STATUS_OPTIONS } from '~/composables/admin/useAdminServicios'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  loading,
  error,
  activeTab,
  expandedId,
  updatingStatus,
  notifyingPartner,
  filteredRequests,
  tabCounts,
  init,
  fetchRequests,
  toggleExpand,
  setActiveTab,
  clearError,
  updateStatus,
  notifyPartner,
  formatDate,
  getTypeIcon,
  getTypeLabel,
  getStatusClass,
  getStatusLabel,
  formatDetailValue,
} = useAdminServicios()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="servicios-page">
    <ServiciosHeader :loading="loading" @refresh="fetchRequests" />

    <ServiciosTypeTabs
      :active-tab="activeTab"
      :tab-counts="tabCounts"
      :get-type-icon="getTypeIcon"
      @select-tab="setActiveTab"
    />

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
      <button class="dismiss-btn" @click="clearError">
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

    <!-- Data views -->
    <template v-else>
      <ServiciosDesktopTable
        :requests="filteredRequests"
        :expanded-id="expandedId"
        :updating-status="updatingStatus"
        :notifying-partner="notifyingPartner"
        :status-options="STATUS_OPTIONS"
        :get-type-icon="getTypeIcon"
        :get-type-label="getTypeLabel"
        :get-status-class="getStatusClass"
        :get-status-label="getStatusLabel"
        :format-date="formatDate"
        :format-detail-value="formatDetailValue"
        @toggle-expand="toggleExpand"
        @update-status="updateStatus"
        @notify-partner="notifyPartner"
      />

      <ServiciosMobileCards
        :requests="filteredRequests"
        :expanded-id="expandedId"
        :updating-status="updatingStatus"
        :notifying-partner="notifyingPartner"
        :status-options="STATUS_OPTIONS"
        :get-type-icon="getTypeIcon"
        :get-type-label="getTypeLabel"
        :get-status-class="getStatusClass"
        :get-status-label="getStatusLabel"
        :format-date="formatDate"
        :format-detail-value="formatDetailValue"
        @toggle-expand="toggleExpand"
        @update-status="updateStatus"
        @notify-partner="notifyPartner"
      />
    </template>
  </div>
</template>

<style scoped>
.servicios-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
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
</style>
