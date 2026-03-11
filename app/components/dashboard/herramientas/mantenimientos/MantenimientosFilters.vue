<script setup lang="ts">
/**
 * Filter bar for maintenance records.
 * Allows filtering by vehicle and maintenance type.
 *
 * Uses :value + @change + emit pattern (no v-model on props).
 */
import type { DealerVehicleOption } from '~/composables/dashboard/useDashboardMantenimientos'

defineProps<{
  filterVehicle: string | null
  filterType: string | null
  vehicleOptions: DealerVehicleOption[]
}>()

const emit = defineEmits<{
  'update:filterVehicle': [value: string | null]
  'update:filterType': [value: string | null]
  clear: []
}>()

const { t } = useI18n()

function onVehicleChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  emit('update:filterVehicle', val === '' ? null : val)
}

function onTypeChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  emit('update:filterType', val === '' ? null : val)
}
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group">
      <select :value="filterVehicle ?? ''" class="filter-select" @change="onVehicleChange">
        <option value="">
          {{ t('dashboard.tools.maintenance.filters.allVehicles') }}
        </option>
        <option v-for="v in vehicleOptions" :key="v.id" :value="v.id">
          {{ v.brand }} {{ v.model }} {{ v.year ? `(${v.year})` : '' }}
        </option>
      </select>

      <select :value="filterType ?? ''" class="filter-select" @change="onTypeChange">
        <option value="">{{ t('dashboard.tools.maintenance.filters.allTypes') }}</option>
        <option value="preventivo">
          {{ t('dashboard.tools.maintenance.types.preventivo') }}
        </option>
        <option value="correctivo">
          {{ t('dashboard.tools.maintenance.types.correctivo') }}
        </option>
        <option value="itv">{{ t('dashboard.tools.maintenance.types.itv') }}</option>
      </select>

      <button class="btn-sm" @click="emit('clear')">
        {{ t('dashboard.tools.maintenance.filters.clear') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

.filter-select {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  min-width: 8.75rem;
  background: var(--bg-primary);
  flex: 1;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-sm {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-size: var(--font-size-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  cursor: pointer;
}

.btn-sm:hover {
  background: var(--bg-secondary);
}

@media (min-width: 48em) {
  .filter-group {
    width: auto;
  }

  .filter-select {
    flex: initial;
    min-width: 11.25rem;
  }
}
</style>
