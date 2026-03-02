<script setup lang="ts">
/**
 * ExportOptionsCard — Filter (status, category) and format toggle (CSV / PDF).
 * Also displays the filtered vehicle count.
 */
const props = defineProps<{
  statusFilter: 'all' | 'published'
  categoryFilter: string | null
  exportFormat: 'csv' | 'pdf'
  availableCategories: string[]
  vehicleCount: number
}>()

const emit = defineEmits<{
  (e: 'update:statusFilter', value: 'all' | 'published'): void
  (e: 'update:categoryFilter', value: string | null): void
  (e: 'update:exportFormat', value: 'csv' | 'pdf'): void
}>()

const { t } = useI18n()

function onStatusChange(event: Event): void {
  const raw = (event.target as HTMLSelectElement).value as 'all' | 'published'
  emit('update:statusFilter', raw)
}

function onCategoryChange(event: Event): void {
  const raw = (event.target as HTMLSelectElement).value
  emit('update:categoryFilter', raw || null)
}
</script>

<template>
  <div class="options-card">
    <h2>{{ t('dashboard.tools.export.options') }}</h2>

    <div class="options-grid">
      <!-- Status filter -->
      <div class="field">
        <label>{{ t('dashboard.tools.export.statusFilter') }}</label>
        <select class="field-select" :value="props.statusFilter" @change="onStatusChange">
          <option value="all">{{ t('dashboard.tools.export.allVehicles') }}</option>
          <option value="published">{{ t('dashboard.tools.export.publishedOnly') }}</option>
        </select>
      </div>

      <!-- Category filter -->
      <div class="field">
        <label>{{ t('dashboard.tools.export.categoryFilter') }}</label>
        <select class="field-select" :value="props.categoryFilter ?? ''" @change="onCategoryChange">
          <option value="">{{ t('dashboard.tools.export.allCategories') }}</option>
          <option v-for="cat in props.availableCategories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <!-- Export format -->
      <div class="field">
        <label>{{ t('dashboard.tools.export.format') }}</label>
        <div class="format-toggle">
          <button
            class="format-btn"
            :class="{ active: props.exportFormat === 'csv' }"
            @click="emit('update:exportFormat', 'csv')"
          >
            CSV
          </button>
          <button
            class="format-btn"
            :class="{ active: props.exportFormat === 'pdf' }"
            @click="emit('update:exportFormat', 'pdf')"
          >
            PDF {{ t('dashboard.tools.export.catalog') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Vehicle count -->
    <div class="vehicle-count">
      <strong>{{ props.vehicleCount }}</strong> {{ t('dashboard.tools.export.vehiclesToExport') }}
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

.options-card h2 {
  margin: 0 0 16px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.field-select {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.field-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Format toggle */
.format-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.format-btn {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  border: none;
  background: var(--bg-primary);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all 0.15s;
}

.format-btn + .format-btn {
  border-left: 1px solid #e5e7eb;
}

.format-btn.active {
  background: var(--color-primary);
  color: white;
}

/* Vehicle count */
.vehicle-count {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e40af;
}

@media (min-width: 768px) {
  .options-grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .options-grid .field {
    flex: 1;
    min-width: 180px;
  }
}
</style>
