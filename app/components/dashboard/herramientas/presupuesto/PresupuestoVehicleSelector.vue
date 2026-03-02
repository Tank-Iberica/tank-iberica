<script setup lang="ts">
import type { DealerVehicleOption } from '~/composables/dashboard/useDashboardPresupuesto'
import { formatPrice } from '~/composables/shared/useListingUtils'

defineProps<{
  searchQuery: string
  showDropdown: boolean
  selectedVehicle: DealerVehicleOption | null
  filteredVehicles: DealerVehicleOption[]
  vehicleThumbnail: string | null
  vehicleTitle: string
  vehiclePrice: number
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'select', vehicle: DealerVehicleOption): void
  (e: 'focus' | 'blur' | 'clear'): void
}>()

const { t } = useI18n()

function onSearchInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}
</script>

<template>
  <section class="form-section">
    <h2>{{ t('dashboard.quote.selectVehicle') }}</h2>

    <div class="vehicle-search-wrapper">
      <input
        type="text"
        class="input-field"
        :value="searchQuery"
        :placeholder="t('dashboard.quote.selectVehiclePlaceholder')"
        @input="onSearchInput"
        @focus="emit('focus')"
        @blur="emit('blur')"
      >
      <button v-if="selectedVehicle" type="button" class="clear-btn" @click="emit('clear')">
        &#10005;
      </button>

      <div v-if="showDropdown && filteredVehicles.length > 0" class="vehicle-dropdown">
        <button
          v-for="v in filteredVehicles"
          :key="v.id"
          type="button"
          class="vehicle-dropdown-item"
          @mousedown.prevent="emit('select', v)"
        >
          <span class="vd-name">{{ v.brand }} {{ v.model }}</span>
          <span v-if="v.year" class="vd-year">({{ v.year }})</span>
          <span v-if="v.price" class="vd-price">{{ formatPrice(v.price) }}</span>
        </button>
      </div>
      <div v-if="showDropdown && filteredVehicles.length === 0" class="vehicle-dropdown">
        <div class="vd-empty">{{ t('dashboard.quote.noVehicles') }}</div>
      </div>
    </div>

    <!-- Selected vehicle card -->
    <div v-if="selectedVehicle" class="selected-vehicle-card">
      <img
        v-if="vehicleThumbnail"
        :src="vehicleThumbnail"
        :alt="vehicleTitle"
        class="selected-vehicle-img"
      >
      <div class="selected-vehicle-info">
        <span class="sv-title">{{ vehicleTitle }}</span>
        <span class="sv-price">{{ formatPrice(vehiclePrice) }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 44px;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Vehicle search */
.vehicle-search-wrapper {
  position: relative;
}

.clear-btn {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-disabled);
  font-size: 1rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vehicle-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 50;
}

.vehicle-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  min-height: 44px;
  transition: background 0.15s;
}

.vehicle-dropdown-item:hover {
  background: var(--bg-secondary);
}

.vd-name {
  font-weight: 500;
  color: var(--text-primary);
}

.vd-year {
  color: var(--text-disabled);
  font-size: 0.85rem;
}

.vd-price {
  margin-left: auto;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 0.85rem;
}

.vd-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.9rem;
}

/* Selected vehicle card */
.selected-vehicle-card {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--color-gray-200);
}

.selected-vehicle-img {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.selected-vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sv-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.sv-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .selected-vehicle-img {
    width: 160px;
    height: 100px;
  }
}
</style>
