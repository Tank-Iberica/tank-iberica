<script setup lang="ts">
import type { MaintenanceEntry, RentalEntry } from '~/composables/admin/useAdminVehicles'

const props = defineProps<{
  minPrice: number | null | undefined
  acquisitionCost: number | null | undefined
  acquisitionDate: string | null | undefined
  maintenanceRecords: MaintenanceEntry[]
  rentalRecords: RentalEntry[]
  totalMaint: number
  totalRental: number
  totalCost: number
  fmt: (val: number | null | undefined) => string
}>()

const emit = defineEmits<{
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

function onMinPriceInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:minPrice', val ? Number(val) : null)
}

function onAcquisitionCostInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:acquisitionCost', val ? Number(val) : null)
}

function onAcquisitionDateInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:acquisitionDate', val || null)
}
</script>

<template>
  <div class="section-content">
    <div class="row-3">
      <div class="field">
        <label>Precio mínimo €</label>
        <input
          type="number"
          :value="props.minPrice"
          placeholder="Precio mínimo aceptable"
          @input="onMinPriceInput"
        >
      </div>
      <div class="field">
        <label>Coste adquisición €</label>
        <input
          type="number"
          :value="props.acquisitionCost"
          placeholder="Coste de compra"
          @input="onAcquisitionCostInput"
        >
      </div>
      <div class="field">
        <label>Fecha adquisición</label>
        <input type="date" :value="props.acquisitionDate" @input="onAcquisitionDateInput" >
      </div>
    </div>

    <!-- Maintenance table -->
    <div class="records-block">
      <div class="records-header">
        <span>🔧 Mantenimiento (suma)</span>
        <button class="btn-add" @click="emit('add-maint')">+ Añadir</button>
      </div>
      <table v-if="maintenanceRecords.length" class="records-table">
        <thead>
          <tr>
            <th>{{ $t('common.date') }}</th>
            <th>Razón</th>
            <th>Coste €</th>
            <th>Factura</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in maintenanceRecords" :key="r.id">
            <td>
              <input
                type="date"
                :value="r.date"
                @input="
                  emit('update-maint', r.id, 'date', ($event.target as HTMLInputElement).value)
                "
              >
            </td>
            <td>
              <input
                type="text"
                :value="r.reason"
                placeholder="Razón"
                @input="
                  emit('update-maint', r.id, 'reason', ($event.target as HTMLInputElement).value)
                "
              >
            </td>
            <td>
              <input
                type="number"
                :value="r.cost"
                placeholder="0"
                @input="
                  emit(
                    'update-maint',
                    r.id,
                    'cost',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              >
            </td>
            <td>
              <input
                type="text"
                :value="r.invoice_url"
                placeholder="URL factura"
                @input="
                  emit(
                    'update-maint',
                    r.id,
                    'invoice_url' as keyof MaintenanceEntry,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              >
            </td>
            <td>
              <button
                class="btn-x"
                :aria-label="$t('common.delete')"
                @click="emit('remove-maint', r.id)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right">Total Mant:</td>
            <td colspan="3">
              <strong>{{ fmt(totalMaint) }}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
      <div v-else class="empty-msg">Sin registros de mantenimiento.</div>
    </div>

    <!-- Rental income table -->
    <div class="records-block">
      <div class="records-header">
        <span>📅 Renta (resta)</span>
        <button class="btn-add" @click="emit('add-rental')">+ Añadir</button>
      </div>
      <table v-if="rentalRecords.length" class="records-table">
        <thead>
          <tr>
            <th>Desde</th>
            <th>Hasta</th>
            <th>Razón</th>
            <th>Importe €</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rentalRecords" :key="r.id">
            <td>
              <input
                type="date"
                :value="r.from_date"
                @input="
                  emit(
                    'update-rental',
                    r.id,
                    'from_date',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              >
            </td>
            <td>
              <input
                type="date"
                :value="r.to_date"
                @input="
                  emit('update-rental', r.id, 'to_date', ($event.target as HTMLInputElement).value)
                "
              >
            </td>
            <td>
              <input
                type="text"
                :value="r.notes"
                placeholder="Razón"
                @input="
                  emit('update-rental', r.id, 'notes', ($event.target as HTMLInputElement).value)
                "
              >
            </td>
            <td>
              <input
                type="number"
                :value="r.amount"
                placeholder="0"
                @input="
                  emit(
                    'update-rental',
                    r.id,
                    'amount',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              >
            </td>
            <td>
              <button
                class="btn-x"
                :aria-label="$t('common.delete')"
                @click="emit('remove-rental', r.id)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right">Total Renta:</td>
            <td colspan="2">
              <strong class="green">{{ fmt(totalRental) }}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
      <div v-else class="empty-msg">Sin registros de alquiler.</div>
    </div>

    <!-- Cost summary -->
    <div class="cost-summary">
      <div class="cost-row">
        <span>Coste adquisición</span><span>{{ fmt(props.acquisitionCost) }}</span>
      </div>
      <div class="cost-row">
        <span>+ Mantenimiento</span><span>{{ fmt(totalMaint) }}</span>
      </div>
      <div class="cost-row">
        <span>− Renta</span><span class="green">{{ fmt(totalRental) }}</span>
      </div>
      <div class="cost-row total">
        <span>COSTE TOTAL</span><span>{{ fmt(totalCost) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Rows */
.row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-3);
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
}
.field input {
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}
.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Records table */
.records-block {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-gray-200);
}
.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.625rem;
  font-weight: 600;
  font-size: 0.85rem;
}
.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.records-table th {
  text-align: left;
  padding: 0.375rem var(--spacing-2);
  background: var(--bg-secondary);
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
}
.records-table td {
  padding: var(--spacing-1) var(--spacing-2);
  border-bottom: 1px solid var(--color-gray-100);
}
.records-table input {
  width: 100%;
  padding: var(--spacing-1) 0.375rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
}
.records-table tfoot td {
  padding-top: var(--spacing-2);
  border: none;
}
.text-right {
  text-align: right;
}

/* Cost summary */
.cost-summary {
  margin-top: var(--spacing-4);
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
}
.cost-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-gray-500);
  padding: var(--spacing-1) 0;
}
.cost-row.total {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-gray-200);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-gray-700);
}
.green {
  color: var(--color-success);
}

/* Buttons */
.btn-add {
  padding: var(--spacing-1) 0.625rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-x {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
}

/* Empty message */
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: var(--spacing-4);
}

/* Mobile */
@media (max-width: 48em) {
  .row-3 {
    grid-template-columns: 1fr;
  }
  .records-table {
    font-size: 0.7rem;
  }
}
</style>
