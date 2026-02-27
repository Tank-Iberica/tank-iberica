<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'
import type { DealerVehicleForExport } from '~/composables/dashboard/useDashboardExportarAnuncio'

const props = defineProps<{
  vehicles: DealerVehicleForExport[]
  selectedVehicleId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:vehicleId', value: string | null): void
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #64748b;
}

.empty-state p {
  margin: 0 0 12px 0;
}

.select-vehicle {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  background: white;
  cursor: pointer;
}

.select-vehicle:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}
</style>
