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
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.filter-select {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-width: 140px;
  background: #fff;
  flex: 1;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.btn-sm {
  min-height: 44px;
  padding: 8px 12px;
  font-size: 0.8rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.btn-sm:hover {
  background: #f8fafc;
}

@media (min-width: 768px) {
  .filter-group {
    width: auto;
  }

  .filter-select {
    flex: initial;
    min-width: 180px;
  }
}
</style>
