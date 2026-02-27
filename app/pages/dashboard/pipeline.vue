<script setup lang="ts">
/**
 * Dealer Pipeline — Kanban-style commercial pipeline.
 * Premium/Founding plan only. Uses native HTML5 drag & drop.
 *
 * All logic lives in useDashboardPipeline composable.
 * Subcomponents in app/components/dashboard/pipeline/.
 */
import {
  useDashboardPipeline,
  STAGES,
  STAGE_COLORS,
} from '~/composables/dashboard/useDashboardPipeline'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  itemsByStage,
  totalsByStage,
  loading,
  error,
  isPremiumPlan,
  dragItemId,
  dragOverStage,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  expandedStages,
  toggleStage,
  showModal,
  editingItem,
  form,
  saving,
  openAddModal,
  openEditModal,
  closeModal,
  saveItem,
  removeItem,
  updateFormField,
  formatCurrency,
  init,
} = useDashboardPipeline()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="pipeline-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.pipeline.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.pipeline.subtitle') }}</p>
      </div>
    </header>

    <!-- Plan gate -->
    <PipelineUpgradeCard v-if="!isPremiumPlan && !loading" />

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <!-- Kanban board -->
    <div v-if="isPremiumPlan && !loading" class="kanban-board">
      <PipelineKanbanColumn
        v-for="stage in STAGES"
        :key="stage"
        :stage="stage"
        :items="itemsByStage[stage]"
        :total="totalsByStage[stage]"
        :stage-color="STAGE_COLORS[stage]"
        :is-drag-over="dragOverStage === stage"
        :is-expanded="expandedStages.has(stage)"
        :drag-item-id="dragItemId"
        :format-currency="formatCurrency"
        @toggle-stage="toggleStage(stage)"
        @add-item="openAddModal(stage)"
        @edit-item="openEditModal($event)"
        @drag-start="(ev: DragEvent, id: string) => onDragStart(ev, id)"
        @drag-over="(ev: DragEvent) => onDragOver(ev, stage)"
        @drag-leave="onDragLeave"
        @drop="(ev: DragEvent) => onDrop(ev, stage)"
        @drag-end="onDragEnd"
      />
    </div>

    <!-- Modal: Add / Edit item -->
    <PipelineItemModal
      :show="showModal"
      :editing-item="editingItem"
      :form="form"
      :saving="saving"
      @close="closeModal"
      @save="saveItem"
      @delete="removeItem"
      @update:field="(key: never, value: never) => updateFormField(key, value)"
    />
  </div>
</template>

<style scoped>
.pipeline-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* ── Error / Loading ───────────────────────────────────────────── */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Kanban Board ──────────────────────────────────────────────── */
.kanban-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Desktop layout ────────────────────────────────────────────── */
@media (min-width: 768px) {
  .pipeline-page {
    padding: 24px;
  }

  .kanban-board {
    flex-direction: row;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .kanban-board :deep(.kanban-column) {
    min-width: 240px;
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .kanban-board :deep(.kanban-column) {
    min-width: 260px;
  }
}
</style>
