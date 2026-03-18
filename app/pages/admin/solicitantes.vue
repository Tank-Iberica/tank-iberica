<script setup lang="ts">
import { useAdminSolicitantes, type DemandStatus } from '~/composables/admin/useAdminSolicitantes'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  demands,
  loading,
  saving,
  error,
  total,
  filters,
  deleteModal,
  detailModal,
  canDelete,
  init,
  handleStatusChange,
  openDetail,
  closeDetail,
  saveNotes,
  confirmDelete,
  closeDeleteModal,
  executeDelete,
} = useAdminSolicitantes()

onMounted(() => {
  init()
})

function onUpdateStatus(value: DemandStatus | null) {
  filters.value.status = value
}

function onUpdateSearch(value: string) {
  filters.value.search = value
}

function onUpdateNotes(value: string) {
  detailModal.value.notes = value
}

function onUpdateConfirmText(value: string) {
  deleteModal.value.confirmText = value
}
</script>

<template>
  <div class="admin-solicitantes">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.solicitantes.title') }}</h2>
      <span class="total-badge">{{ total }} {{ $t('common.records', 'registros') }}</span>
    </div>

    <!-- Filters -->
    <AdminSolicitantesFiltersBar
      :current-status="filters.status ?? null"
      :search-query="filters.search ?? ''"
      @update:status="onUpdateStatus"
      @update:search="onUpdateSearch"
    />

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="5" :cols="5" />
    </div>

    <!-- Table -->
    <AdminSolicitantesDemandsTable
      v-else
      :demands="demands"
      @status-change="(d, s) => handleStatusChange(d, s)"
      @view-detail="(d) => openDetail(d)"
      @confirm-delete="(d) => confirmDelete(d)"
    />

    <!-- Detail Modal -->
    <AdminSolicitantesDetailModal
      :modal="detailModal"
      :saving="saving"
      @close="closeDetail"
      @save="saveNotes"
      @update:notes="onUpdateNotes"
    />

    <!-- Delete Confirmation Modal -->
    <AdminSolicitantesDeleteModal
      :modal="deleteModal"
      :can-delete="canDelete"
      @close="closeDeleteModal"
      @confirm="executeDelete"
      @update:confirm-text="onUpdateConfirmText"
    />
  </div>
</template>

<style scoped>
.admin-solicitantes {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
  padding: 0.375rem var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.85rem;
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: stretch;
  }
}
</style>
