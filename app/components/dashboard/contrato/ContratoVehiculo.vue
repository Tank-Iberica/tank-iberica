<script setup lang="ts">
/**
 * Contract Vehicle Selection Component
 * Displays vehicle selection dropdown and related fields
 */

interface VehicleOption {
  id: string
  label: string
  plate: string
  vehicleType: string
}

interface Props {
  contractVehicle: string
  contractVehicleType: string
  contractVehiclePlate: string
  vehicleOptions: VehicleOption[]
  loadingVehicles: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:contractVehicle': [value: string]
  'update:contractVehicleType': [value: string]
  'update:contractVehiclePlate': [value: string]
  vehicleSelected: []
}>()

const { t } = useI18n()

function onVehicleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update:contractVehicle', value)
  emit('vehicleSelected')
}
</script>

<template>
  <div class="contrato-vehiculo">
    <div class="form-row">
      <div class="form-group" style="flex: 2">
        <label>{{ t('dashboard.tools.contract.vehicle') }}</label>
        <select :value="contractVehicle" :disabled="loadingVehicles" @change="onVehicleChange">
          <option value="">
            {{ t('dashboard.tools.contract.selectVehicle') }}
          </option>
          <option v-for="veh in vehicleOptions" :key="veh.id" :value="veh.id">
            {{ veh.label }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.vehicleType') }}</label>
        <input
          :value="contractVehicleType"
          type="text"
          @input="emit('update:contractVehicleType', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.plate') }}</label>
        <input
          :value="contractVehiclePlate"
          type="text"
          @input="emit('update:contractVehiclePlate', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrato-vehiculo {
  margin-bottom: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 7.5rem;
}

.form-group label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-group input,
.form-group select {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

@media (max-width: 48em) {
  .form-row {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
