<script setup lang="ts">
/**
 * A single draggable pipeline card inside a Kanban column.
 * Emits drag events and click for editing.
 */
import type { PipelineItem } from '~/composables/dashboard/useDashboardPipeline'

defineProps<{
  item: PipelineItem
  isDragging: boolean
  formatCurrency: (value: number | null | undefined) => string
}>()

const emit = defineEmits<{
  'drag-start': [event: DragEvent, itemId: string]
  'drag-end': []
  'edit-item': [item: PipelineItem]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="pipeline-card"
    draggable="true"
    :class="{ dragging: isDragging }"
    @dragstart="emit('drag-start', $event, item.id)"
    @dragend="emit('drag-end')"
    @click="emit('edit-item', item)"
  >
    <div class="card-drag-handle" :aria-label="t('dashboard.pipeline.dragHandle')">
      <span class="drag-dots">&#8942;&#8942;</span>
    </div>
    <div class="card-body">
      <span class="card-title">{{ item.title }}</span>
      <span v-if="item.contact_name" class="card-contact">{{ item.contact_name }}</span>
      <span v-if="item.estimated_value" class="card-value">
        {{ formatCurrency(item.estimated_value) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.pipeline-card {
  display: flex;
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    opacity 0.15s;
  min-height: 2.75rem;
  overflow: hidden;
}

.pipeline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.pipeline-card.dragging {
  opacity: 0.5;
}

.card-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  min-height: 2.75rem;
  flex-shrink: 0;
  cursor: grab;
  color: var(--text-disabled);
  background: var(--bg-secondary);
  touch-action: none;
}

.card-drag-handle:active {
  cursor: grabbing;
}

.drag-dots {
  font-size: 1.1rem;
  letter-spacing: -0.1875rem;
  line-height: 1;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.625rem 0.75rem;
  min-width: 0;
  flex: 1;
}

.card-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-contact {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary);
}
</style>
