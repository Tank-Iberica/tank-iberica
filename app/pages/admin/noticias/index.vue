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

    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="5" :cols="4" />
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
  max-width: 75rem;
}

.error-msg {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-size: 0.875rem;
}

.loading-state {
  padding: 2.5rem 0;
}
</style>
