<script setup lang="ts">
import { useAdminUsuariosPage } from '~/composables/admin/useAdminUsuariosPage'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  users,
  loading,
  saving,
  error,
  total,
  stats,
  filters,
  deleteModal,
  detailModal,
  setFilterRole,
  setFilterSearch,
  openDetail,
  closeDetail,
  setDetailSelectedRole,
  saveRole,
  confirmDelete,
  closeDeleteModal,
  executeDelete,
  handleRoleChange,
  handleExport,
  init,
} = useAdminUsuariosPage()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="admin-usuarios">
    <AdminUsuariosHeader :total="total" @export="handleExport" />

    <AdminUsuariosStatsGrid :stats="stats" />

    <AdminUsuariosFiltersBar
      :role="filters.role"
      :search="filters.search"
      @filter-role="setFilterRole"
      @filter-search="setFilterSearch"
    />

    <AdminUsuariosTable
      :users="users"
      :loading="loading"
      :error="error"
      @view-detail="openDetail"
      @confirm-delete="confirmDelete"
      @role-change="handleRoleChange"
    />

    <AdminUsuariosDetailModal
      :show="detailModal.show"
      :user="detailModal.user"
      :selected-role="detailModal.selectedRole"
      :saving="saving"
      @close="closeDetail"
      @update-selected-role="setDetailSelectedRole"
      @save="saveRole"
    />

    <AdminUsuariosDeleteModal
      :show="deleteModal.show"
      :user="deleteModal.user"
      @close="closeDeleteModal"
      @confirm="executeDelete"
    />
  </div>
</template>

<style scoped>
.admin-usuarios {
  padding: 0;
}
</style>
