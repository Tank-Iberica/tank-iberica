<script setup lang="ts">
/**
 * A single Kanban column: header (stage dot, title, count, total, add button)
 * + cards list. Handles column-level drag events; delegates card events upward.
 */
import type { PipelineItem, PipelineStage } from '~/composables/dashboard/useDashboardPipeline'

const props = defineProps<{
  stage: PipelineStage
  items: PipelineItem[]
  total: number
  stageColor: string
  isDragOver: boolean
  isExpanded: boolean
  dragItemId: string | null
  formatCurrency: (value: number | null | undefined) => string
}>()

const emit = defineEmits<{
  'toggle-stage': []
  'add-item': []
  'edit-item': [item: PipelineItem]
  'drag-start': [event: DragEvent, itemId: string]
  'drag-over': [event: DragEvent]
  'drag-leave': []
  drop: [event: DragEvent]
  'drag-end': []
}>()

const { t } = useI18n()

function onCardDragStart(event: DragEvent, itemId: string): void {
  emit('drag-start', event, itemId)
}
</script>

<template>
  <div
    class="kanban-column"
    :class="{
      'drag-over': isDragOver,
      expanded: isExpanded,
    }"
    @dragover="emit('drag-over', $event)"
    @dragleave="emit('drag-leave')"
    @drop="emit('drop', $event)"
  >
    <!-- Column header -->
    <div class="column-header" @click="emit('toggle-stage')">
      <div class="column-header-left">
        <span class="stage-dot" :style="{ backgroundColor: stageColor }" />
        <h3 class="column-title">{{ t(`dashboard.pipeline.stage.${stage}`) }}</h3>
        <span class="column-count">{{ items.length }}</span>
      </div>
      <div class="column-header-right">
        <span class="column-total">{{ formatCurrency(total) }}</span>
        <button
          class="btn-add"
          :aria-label="t('dashboard.pipeline.addItem')"
          @click.stop="emit('add-item')"
        >
          +
        </button>
        <span class="accordion-arrow">&#9662;</span>
      </div>
    </div>

    <!-- Cards container -->
    <div class="column-cards">
      <div v-if="items.length === 0" class="column-empty">
        <span>{{ t('dashboard.pipeline.emptyColumn') }}</span>
      </div>
      <PipelineCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :is-dragging="props.dragItemId === item.id"
        :format-currency="formatCurrency"
        @drag-start="onCardDragStart"
        @drag-end="emit('drag-end')"
        @edit-item="emit('edit-item', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.kanban-column {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px solid transparent;
  transition:
    border-color 0.2s,
    background 0.2s;
  overflow: hidden;
}

.kanban-column.drag-over {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}

/* ── Column header ─────────────────────────────────────────────── */
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  min-height: 48px;
  user-select: none;
}

.column-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.column-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.column-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
  border-radius: 10px;
  padding: 1px 8px;
}

.column-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-total {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary);
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: var(--color-primary);
  color: white;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-add:hover {
  background: var(--color-primary-dark);
}

.accordion-arrow {
  font-size: 1rem;
  color: var(--text-disabled);
  transition: transform 0.2s;
}

.kanban-column.expanded .accordion-arrow {
  transform: rotate(180deg);
}

/* ── Cards container (mobile accordion) ────────────────────────── */
.column-cards {
  display: none;
  padding: 0 12px 12px;
  flex-direction: column;
  gap: 8px;
}

.kanban-column.expanded .column-cards {
  display: flex;
}

.column-empty {
  text-align: center;
  padding: 16px 8px;
  color: var(--text-disabled);
  font-size: 0.85rem;
}

/* ── Desktop layout ────────────────────────────────────────────── */
@media (min-width: 768px) {
  /* On desktop, always show cards — no accordion */
  .column-cards {
    display: flex;
  }

  .accordion-arrow {
    display: none;
  }

  .column-header {
    cursor: default;
  }
}
</style>
