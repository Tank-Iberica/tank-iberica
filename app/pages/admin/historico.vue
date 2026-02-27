<script setup lang="ts">
import { useAdminHistoricoPage } from '~/composables/admin/useAdminHistoricoPage'
import type { HistoricoPageFilters } from '~/composables/admin/useAdminHistoricoPage'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'

const { locale } = useI18n()

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const h = useAdminHistoricoPage()
const { types, fetchTypes } = useAdminTypes()
const { subcategories, fetchSubcategories } = useAdminSubcategories()

// Load data
onMounted(async () => {
  await Promise.all([h.fetchEntries(h.filters), fetchSubcategories(), fetchTypes()])
})

// Watch filters
watch(
  h.filters,
  () => {
    h.fetchEntries(h.filters)
  },
  { deep: true },
)

// Fullscreen listener
onMounted(() => {
  document.addEventListener('fullscreenchange', h.onFullscreenChange)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', h.onFullscreenChange)
})

function onFilterUpdate(key: keyof HistoricoPageFilters, value: string | number | null) {
  ;(h.filters as Record<string, unknown>)[key] = value
}
</script>

<template>
  <div
    :ref="
      (el) => {
        h.historicoSection.value = el as HTMLElement | null
      }
    "
    class="historico-page"
    :class="{ fullscreen: h.isFullscreen.value }"
  >
    <HistoricoHeader
      :is-fullscreen="h.isFullscreen.value"
      @toggle-fullscreen="h.toggleFullscreen()"
      @open-export="h.showExportModal.value = true"
    />

    <div v-if="h.error.value" class="error-msg">{{ h.error.value }}</div>

    <HistoricoSummaryCards :summary="h.summary.value" :fmt="h.fmt" />

    <HistoricoFiltersBar
      :filters="h.filters"
      :available-years="h.availableYears.value"
      :available-brands="h.availableBrands.value"
      :category-options="h.categoryOptions"
      :subcategories="subcategories"
      :types="types"
      :locale="locale"
      @update:filter="onFilterUpdate"
      @clear="h.clearFilters()"
    />

    <HistoricoColumnToggles
      :show-docs="h.showDocs.value"
      :show-tecnico="h.showTecnico.value"
      :show-alquiler="h.showAlquiler.value"
      :total="h.total.value"
      @update:show-docs="h.showDocs.value = $event"
      @update:show-tecnico="h.showTecnico.value = $event"
      @update:show-alquiler="h.showAlquiler.value = $event"
    />

    <HistoricoDataTable
      :entries="h.sortedEntries.value"
      :loading="h.loading.value"
      :show-docs="h.showDocs.value"
      :show-tecnico="h.showTecnico.value"
      :show-alquiler="h.showAlquiler.value"
      :locale="locale"
      :fmt="h.fmt"
      :fmt-date="h.fmtDate"
      :get-sort-icon="h.getSortIcon"
      @sort="h.toggleSort"
      @open-detail="h.openDetailModal"
      @open-restore="h.openRestoreModal"
      @open-delete="h.openDeleteModal"
    />

    <HistoricoDetailModal
      :visible="h.showDetailModal.value"
      :entry="h.detailEntry.value"
      :fmt="h.fmt"
      :fmt-date="h.fmtDate"
      @close="h.showDetailModal.value = false"
    />

    <HistoricoRestoreModal
      :visible="h.showRestoreModal.value"
      :target="h.restoreTarget.value"
      :confirm-text="h.restoreConfirm.value"
      :can-restore="h.canRestore.value"
      :saving="h.saving.value"
      @close="h.showRestoreModal.value = false"
      @confirm="h.handleRestore()"
      @update:confirm-text="h.restoreConfirm.value = $event"
    />

    <HistoricoDeleteModal
      :visible="h.showDeleteModal.value"
      :target="h.deleteTarget.value"
      :confirm-text="h.deleteConfirm.value"
      :can-delete="h.canDelete.value"
      :saving="h.saving.value"
      :fmt="h.fmt"
      @close="h.showDeleteModal.value = false"
      @confirm="h.handleDelete()"
      @update:confirm-text="h.deleteConfirm.value = $event"
    />

    <HistoricoExportModal
      :visible="h.showExportModal.value"
      :export-format="h.exportFormat.value"
      :export-data-scope="h.exportDataScope.value"
      @close="h.showExportModal.value = false"
      @confirm="h.exportHistorico()"
      @update:export-format="h.exportFormat.value = $event"
      @update:export-data-scope="h.exportDataScope.value = $event"
    />
  </div>
</template>

<style scoped>
.historico-page {
  max-width: 1400px;
  margin: 0 auto;
}
.historico-page.fullscreen {
  max-width: none;
  padding: 20px;
  background: #f9fafb;
  min-height: 100vh;
}
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
}
</style>
