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
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    opacity 0.15s;
  min-height: 44px;
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
  width: 44px;
  min-height: 44px;
  flex-shrink: 0;
  cursor: grab;
  color: #94a3b8;
  background: #f8fafc;
  touch-action: none;
}

.card-drag-handle:active {
  cursor: grabbing;
}

.drag-dots {
  font-size: 1.1rem;
  letter-spacing: -3px;
  line-height: 1;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  min-width: 0;
  flex: 1;
}

.card-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-contact {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary, #23424a);
}
</style>
