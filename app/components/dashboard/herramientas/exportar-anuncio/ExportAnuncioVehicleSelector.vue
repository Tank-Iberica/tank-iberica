<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'
import type { DealerVehicleForExport } from '~/composables/dashboard/useDashboardExportarAnuncio'

const props = defineProps<{
  vehicles: DealerVehicleForExport[]
  selectedVehicleId: string | null
}>()

const emit = defineEmits<{
  'update:vehicleId': [value: string | null]
}>()

const { t } = useI18n()

function onSelectChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update:vehicleId', target.value || null)
}
</script>

<template>
  <section class="card">
    <h2 class="card-title">{{ t('dashboard.adExport.selectVehicle') }}</h2>

    <div v-if="props.vehicles.length === 0" class="empty-state">
      <p>{{ t('dashboard.adExport.noVehicles') }}</p>
      <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-primary">
        {{ t('dashboard.vehicles.publishNew') }}
      </NuxtLink>
    </div>

    <select
      v-else
      :value="props.selectedVehicleId ?? ''"
      class="select-vehicle"
      @change="onSelectChange"
    >
      <option value="" disabled>
        {{ t('dashboard.adExport.selectVehiclePlaceholder') }}
      </option>
      <option v-for="v in props.vehicles" :key="v.id" :value="v.id">
        {{ v.brand }} {{ v.model }}{{ v.year ? ` (${v.year})` : '' }}
        {{ v.price ? ` — ${formatPrice(v.price)}` : '' }}
      </option>
    </select>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}

.card-title {
  margin: 0 0 1rem 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-auxiliary);
}

.empty-state p {
  margin: 0 0 0.75rem 0;
}

.select-vehicle {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  cursor: pointer;
}

.select-vehicle:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring-strong);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
