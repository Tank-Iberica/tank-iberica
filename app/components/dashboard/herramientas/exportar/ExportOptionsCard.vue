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
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.options-card h2 {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
}

.field-select {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
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
  border-radius: var(--border-radius);
  overflow: hidden;
}

.format-btn {
  flex: 1;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border: none;
  background: var(--bg-primary);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all 0.15s;
}

.format-btn + .format-btn {
  border-left: 1px solid var(--color-gray-200);
}

.format-btn.active {
  background: var(--color-primary);
  color: white;
}

/* Vehicle count */
.vehicle-count {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-sky-50);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  color: var(--badge-info-bg);
}

@media (min-width: 48em) {
  .options-grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .options-grid .field {
    flex: 1;
    min-width: 11.25rem;
  }
}
</style>
