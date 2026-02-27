<script setup lang="ts">
import { useAdminNoticiasIndex } from '~/composables/admin/useAdminNoticiasIndex'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // State
  loading,
  error,
  total,
  filters,
  sortedNews,
  hasActiveFilters,
  deleteModal,
  deleteTarget,
  deleteConfirmText,

  // Options
  statusOptions,
  categoryOptions,
  categoryLabels,

  // Actions
  init,
  clearFilters,
  toggleSort,
  getSortIcon,
  openDeleteModal,
  closeDeleteModal,
  executeDelete,
  handleStatusChange,
  getSeoScore,
  formatDate,
  navigateToItem,
} = useAdminNoticiasIndex()

function onUpdateSearch(value: string) {
  filters.value.search = value
}

function onUpdateCategory(value: string | null) {
  filters.value.category = value
}

function onUpdateStatus(value: string | null) {
  filters.value.status = value
}

function onUpdateConfirmText(value: string) {
  deleteConfirmText.value = value
}

onMounted(() => init())
</script>

<template>
  <div class="noticias-page">
    <NoticiasHeader :total="total" />

    <div v-if="error" class="error-msg">{{ error }}</div>

    <NoticiasToolbar
      :filters="filters"
      :status-options="statusOptions"
      :category-options="categoryOptions"
      :has-active-filters="!!hasActiveFilters"
      @update:search="onUpdateSearch"
      @update:category="onUpdateCategory"
      @update:status="onUpdateStatus"
      @clear-filters="clearFilters"
    />

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      Cargando noticias...
    </div>

    <NoticiasTable
      v-else
      :sorted-news="sortedNews"
      :has-active-filters="!!hasActiveFilters"
      :category-labels="categoryLabels"
      :get-sort-icon="getSortIcon"
      :get-seo-score="getSeoScore"
      :format-date="formatDate"
      @toggle-sort="toggleSort"
      @navigate="navigateToItem"
      @status-change="handleStatusChange"
      @delete="openDeleteModal"
    />

    <NoticiasDeleteModal
      :visible="deleteModal"
      :target="deleteTarget"
      :confirm-text="deleteConfirmText"
      @update:confirm-text="onUpdateConfirmText"
      @close="closeDeleteModal"
      @confirm="executeDelete"
    />
  </div>
</template>

<style scoped>
.noticias-page {
  max-width: 1200px;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  justify-content: center;
  color: #64748b;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
