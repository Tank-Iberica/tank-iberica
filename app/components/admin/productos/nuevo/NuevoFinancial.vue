<script setup lang="ts">
import type { MaintenanceEntry, RentalEntry } from '~/composables/admin/useAdminVehicles'

interface Props {
  open: boolean
  minPrice: number | null | undefined
  acquisitionCost: number | null | undefined
  acquisitionDate: string | null | undefined
  maintenanceRecords: MaintenanceEntry[]
  rentalRecords: RentalEntry[]
  totalMaint: number
  totalRental: number
  totalCost: number
  fmt: (val: number | null | undefined) => string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add-maint': []
  'remove-maint': [id: string]
  'update-maint': [id: string, field: keyof MaintenanceEntry, val: string | number]
  'add-rental': []
  'remove-rental': [id: string]
  'update-rental': [id: string, field: keyof RentalEntry, val: string | number]
  'update:minPrice': [value: number | null]
  'update:acquisitionCost': [value: number | null]
  'update:acquisitionDate': [value: string | null]
}>()
</script>

<template>
  <div class="section collapsible financial">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>Cuentas</span>
      <span class="cost-badge">COSTE TOTAL: {{ fmt(totalCost) }}</span>
    </button>
    <AdminProductFinancialSection
      v-if="open"
      :min-price="minPrice"
      :acquisition-cost="acquisitionCost"
      :acquisition-date="acquisitionDate"
      :maintenance-records="maintenanceRecords"
      :rental-records="rentalRecords"
      :total-maint="totalMaint"
      :total-rental="totalRental"
      :total-cost="totalCost"
      :fmt="fmt"
      @add-maint="emit('add-maint')"
      @remove-maint="(id: string) => emit('remove-maint', id)"
      @update-maint="
        (id: string, field: keyof MaintenanceEntry, val: string | number) =>
          emit('update-maint', id, field, val)
      "
      @add-rental="emit('add-rental')"
      @remove-rental="(id: string) => emit('remove-rental', id)"
      @update-rental="
        (id: string, field: keyof RentalEntry, val: string | number) =>
          emit('update-rental', id, field, val)
      "
      @update:min-price="(val: number | null) => emit('update:minPrice', val)"
      @update:acquisition-cost="(val: number | null) => emit('update:acquisitionCost', val)"
      @update:acquisition-date="(val: string | null) => emit('update:acquisitionDate', val)"
    />
  </div>
</template>

<style scoped>
.section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
}
.section-toggle:hover {
  background: #f9fafb;
}
.financial {
  border: 1px solid #d1d5db;
}
.cost-badge {
  padding: 4px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
