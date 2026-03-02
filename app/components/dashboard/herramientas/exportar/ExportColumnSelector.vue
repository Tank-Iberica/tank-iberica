<script setup lang="ts">
/**
 * ExportColumnSelector — Checkboxes for selecting CSV columns to include in export.
 */
import type { CsvColumn, CsvColumnOption } from '~/composables/dashboard/useDashboardExportar'

defineProps<{
  csvColumns: CsvColumnOption[]
  selectedColumnsCount: number
  getColumnLabel: (key: CsvColumn) => string
}>()

const emit = defineEmits<{
  (e: 'toggleColumn', index: number): void
  (e: 'toggleAllColumns', enabled: boolean): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="options-card">
    <div class="columns-header">
      <h2>{{ t('dashboard.tools.export.selectColumns') }}</h2>
      <div class="columns-actions">
        <button class="btn-text" @click="emit('toggleAllColumns', true)">
          {{ t('dashboard.tools.export.selectAll') }}
        </button>
        <button class="btn-text" @click="emit('toggleAllColumns', false)">
          {{ t('dashboard.tools.export.deselectAll') }}
        </button>
      </div>
    </div>
    <p class="columns-count">
      {{ selectedColumnsCount }} {{ t('dashboard.tools.export.columnsSelected') }}
    </p>
    <div class="columns-grid">
      <label v-for="(col, idx) in csvColumns" :key="col.key" class="column-checkbox">
        <input type="checkbox" :checked="col.enabled" @change="emit('toggleColumn', idx)" />
        <span>{{ getColumnLabel(col.key) }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.options-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.columns-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.columns-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.columns-actions {
  display: flex;
  gap: 12px;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 8px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-text:hover {
  text-decoration: underline;
}

.columns-count {
  margin: 0 0 12px;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.column-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  min-height: 44px;
  transition: background 0.15s;
}

.column-checkbox:hover {
  background: var(--bg-secondary);
}

.column-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

@media (min-width: 480px) {
  .columns-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
