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
      <h2>Solicitantes</h2>
      <span class="total-badge">{{ total }} registros</span>
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
    <div v-if="loading" class="loading-state">Cargando solicitantes...</div>

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
  gap: 12px;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
