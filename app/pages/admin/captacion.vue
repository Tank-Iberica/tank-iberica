<script setup lang="ts">
import { useAdminCaptacion, STATUS_OPTIONS } from '~/composables/admin/useAdminCaptacion'
import AdminLeadStats from '~/components/admin/captacion/AdminLeadStats.vue'
import AdminLeadForm from '~/components/admin/captacion/AdminLeadForm.vue'
import AdminLeadTabs from '~/components/admin/captacion/AdminLeadTabs.vue'
import AdminLeadTable from '~/components/admin/captacion/AdminLeadTable.vue'
import AdminLeadCards from '~/components/admin/captacion/AdminLeadCards.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  // State
  loading,
  error,
  successMessage,
  activeTab,
  expandedId,
  editingNotes,
  savingNotes,
  updatingStatus,
  updatingAssign,
  selectedIds,
  bulkProcessing,
  showManualForm,
  manualFormSaving,
  manualForm,
  adminUsers,
  // Computed
  filteredLeads,
  stats,
  tabCounts,
  allFilteredSelected,
  hasSelection,
  // Data loading
  fetchLeads,
  // Actions
  toggleExpand,
  updateStatus,
  updateAssignment,
  saveNotes,
  toggleSelectAll,
  toggleSelect,
  bulkMarkContacted,
  resetManualForm,
  saveManualLead,
  // Helpers
  formatDate,
  getSourceClass,
  getSourceLabel,
  getStatusClass,
  getStatusLabel,
  getAssignedName,
  formatVehicleTypes,
} = useAdminCaptacion()
</script>

<template>
  <div class="captacion-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('admin.captacion.title') }}</h1>
      <div class="header-actions">
        <button class="btn-add" @click="showManualForm = !showManualForm">
          {{ t('admin.captacion.addManual') }}
        </button>
        <button class="btn-refresh" :disabled="loading" @click="fetchLeads">
          {{ t('admin.captacion.refresh') }}
        </button>
      </div>
    </header>

    <!-- Stats cards -->
    <AdminLeadStats :stats="stats" />

    <!-- Manual lead form (inline) -->
    <AdminLeadForm
      :show="showManualForm"
      :form="manualForm"
      :saving="manualFormSaving"
      @update:show="showManualForm = $event"
      @save="saveManualLead"
      @reset="resetManualForm"
    />

    <!-- Tab filters + Bulk actions -->
    <AdminLeadTabs
      :active-tab="activeTab"
      :tab-counts="tabCounts"
      :has-selection="hasSelection"
      :selected-count="selectedIds.size"
      :bulk-processing="bulkProcessing"
      @update:active-tab="activeTab = $event"
      @bulk-mark-contacted="bulkMarkContacted"
    />

    <!-- Success message -->
    <div v-if="successMessage" class="alert-success">
      {{ successMessage }}
      <button class="dismiss-btn" @click="successMessage = null">
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
      <UiSkeletonTable :rows="6" :cols="5" />
    </div>

    <!-- Empty -->
    <div v-else-if="filteredLeads.length === 0" class="empty-state">
      <p>{{ t('admin.captacion.noLeads') }}</p>
    </div>

    <!-- Desktop table -->
    <AdminLeadTable
      v-else
      :leads="filteredLeads"
      :expanded-id="expandedId"
      :editing-notes="editingNotes"
      :saving-notes="savingNotes"
      :updating-status="updatingStatus"
      :updating-assign="updatingAssign"
      :status-options="STATUS_OPTIONS"
      :admin-users="adminUsers"
      :all-filtered-selected="allFilteredSelected"
      :selected-ids="selectedIds"
      :get-source-class="getSourceClass"
      :get-source-label="getSourceLabel"
      :get-status-class="getStatusClass"
      :get-status-label="getStatusLabel"
      :get-assigned-name="getAssignedName"
      :format-date="formatDate"
      :format-vehicle-types="formatVehicleTypes"
      @toggle-expand="toggleExpand"
      @update-status="updateStatus"
      @update-assignment="updateAssignment"
      @save-notes="saveNotes"
      @toggle-select-all="toggleSelectAll"
      @toggle-select="toggleSelect"
      @update:editing-notes="editingNotes = $event"
    />

    <!-- Mobile card list -->
    <AdminLeadCards
      v-if="!loading && filteredLeads.length > 0"
      :leads="filteredLeads"
      :expanded-id="expandedId"
      :editing-notes="editingNotes"
      :saving-notes="savingNotes"
      :updating-status="updatingStatus"
      :updating-assign="updatingAssign"
      :status-options="STATUS_OPTIONS"
      :admin-users="adminUsers"
      :selected-ids="selectedIds"
      :get-source-class="getSourceClass"
      :get-source-label="getSourceLabel"
      :get-status-class="getStatusClass"
      :get-status-label="getStatusLabel"
      :format-date="formatDate"
      :format-vehicle-types="formatVehicleTypes"
      @toggle-expand="toggleExpand"
      @update-status="updateStatus"
      @update-assignment="updateAssignment"
      @save-notes="saveNotes"
      @toggle-select="toggleSelect"
      @update:editing-notes="editingNotes = $event"
    />
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.captacion-page {
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
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.btn-refresh {
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

.btn-add {
  padding: 0.625rem 1.125rem;
  background: var(--color-focus);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
}

.btn-add:hover {
  background: var(--color-info);
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

.alert-success {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: var(--spacing-1);
  display: flex;
  align-items: center;
}

.loading-state {
  padding: var(--spacing-6);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

@media (min-width: 48em) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
