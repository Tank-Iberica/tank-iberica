<script setup lang="ts">
import { useAdminAnunciantes } from '~/composables/admin/useAdminAnunciantes'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // State
  advertisements,
  loading,
  saving,
  error,
  total,
  filters,
  deleteModal,
  detailModal,
  canDelete,

  // Init
  init,

  // Filter actions
  setStatusFilter,
  setSearchFilter,

  // Status
  getStatusConfig,
  handleStatusChange,

  // Detail modal
  openDetail,
  closeDetail,
  saveNotes,
  updateDetailNotes,

  // Delete modal
  confirmDelete,
  closeDeleteModal,
  updateDeleteConfirmText,
  executeDelete,

  // Helpers
  formatDate,
} = useAdminAnunciantes()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="admin-anunciantes">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.anunciantes.title') }}</h2>
      <span class="total-badge">{{ total }} registros</span>
    </div>

    <!-- Filters -->
    <AdminAnunciantesAnunciantesFilters
      :status-filter="filters.status"
      :search-text="filters.search"
      @update-status="setStatusFilter"
      @update-search="setSearchFilter"
    />

    <!-- Table -->
    <AdminAnunciantesAnunciantesTable
      :advertisements="advertisements"
      :loading="loading"
      :error="error"
      :get-status-config="getStatusConfig"
      :format-date="formatDate"
      @status-change="handleStatusChange"
      @view-detail="openDetail"
      @delete="confirmDelete"
    />

    <!-- Detail Modal -->
    <AdminAnunciantesAnunciantesDetailModal
      :show="detailModal.show"
      :advertisement="detailModal.advertisement"
      :notes="detailModal.notes"
      :saving="saving"
      @close="closeDetail"
      @save="saveNotes"
      @update-notes="updateDetailNotes"
    />

    <!-- Delete Modal -->
    <AdminAnunciantesAnunciantesDeleteModal
      :show="deleteModal.show"
      :advertisement-name="deleteModal.advertisement?.contact_name ?? null"
      :confirm-text="deleteModal.confirmText"
      :can-delete="canDelete"
      @close="closeDeleteModal"
      @confirm="executeDelete"
      @update-confirm-text="updateDeleteConfirmText"
    />
  </div>
</template>

<style scoped>
.admin-anunciantes {
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
  background: var(--bg-secondary);
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
