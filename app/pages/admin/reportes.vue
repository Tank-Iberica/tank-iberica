<script setup lang="ts">
import { reportFilters, useAdminReportes } from '~/composables/admin/useAdminReportes'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const {
  reports,
  loading,
  activeFilter,
  expandedId,
  savingId,
  pendingCount,
  toggleExpand,
  updateStatus,
  saveNotes,
  updateEditNotes,
  getEditNotes,
  init,
} = useAdminReportes()

init()
</script>

<template>
  <div class="admin-reportes">
    <ReportesHeader
      :loading="loading"
      :reports-count="reports.length"
      :pending-count="pendingCount"
      :active-filter="activeFilter"
    />

    <ReportesFilters
      :active-filter="activeFilter"
      :filters="reportFilters"
      @update:active-filter="activeFilter = $event"
    />

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <!-- Reports list -->
    <div v-else-if="reports.length > 0" class="reports-list">
      <ReporteCard
        v-for="report in reports"
        :key="report.id"
        :report="report"
        :is-expanded="expandedId === report.id"
        :is-saving="savingId === report.id"
        :notes-value="getEditNotes(report.id)"
        @toggle-expand="toggleExpand"
        @update-status="updateStatus"
        @save-notes="saveNotes"
        @update-notes="updateEditNotes"
      />
    </div>

    <!-- Empty state -->
    <ReportesEmptyState v-else :active-filter="activeFilter" />
  </div>
</template>

<style scoped>
.admin-reportes {
  padding: 0;
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

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
