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
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.plate') }}</label>
        <input
          :value="contractVehiclePlate"
          type="text"
          @input="emit('update:contractVehiclePlate', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrato-vehiculo {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
