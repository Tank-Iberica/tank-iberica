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
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard :lines="4" />
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
  max-width: 87.5rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

/* ── Error / Loading ───────────────────────────────────────────── */
.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
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

/* ── Kanban Board ──────────────────────────────────────────────── */
.kanban-board {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

/* ── Desktop layout ────────────────────────────────────────────── */
@media (min-width: 48em) {
  .pipeline-page {
    padding: var(--spacing-6);
  }

  .kanban-board {
    flex-direction: row;
    gap: var(--spacing-4);
    overflow-x: auto;
    padding-bottom: var(--spacing-2);
  }

  .kanban-board :deep(.kanban-column) {
    min-width: 15rem;
    flex: 1;
  }
}

@media (min-width: 64em) {
  .kanban-board :deep(.kanban-column) {
    min-width: 16.25rem;
  }
}
</style>
