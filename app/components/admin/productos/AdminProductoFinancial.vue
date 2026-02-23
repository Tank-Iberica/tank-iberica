<script setup lang="ts">
/* eslint-disable @typescript-eslint/unified-signatures */
import type { MaintenanceEntry, RentalEntry } from '~/composables/admin/useAdminVehicles'
import type { FileNamingData } from '~/utils/fileNaming'

interface Props {
  open: boolean
  acquisitionCost: number | null
  acquisitionDate: string | null
  minPrice: number | null
  maintenanceRecords: MaintenanceEntry[]
  rentalRecords: RentalEntry[]
  totalMaint: number
  totalRental: number
  totalCost: number
  driveLoading: boolean
  fileNamingData: FileNamingData
  driveSection: 'Vehiculos' | 'Intermediacion'
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'update:acquisitionCost', value: number | null): void
  (e: 'update:acquisitionDate', value: string | null): void
  (e: 'update:minPrice', value: number | null): void
  (e: 'add-maint'): void
  (e: 'remove-maint', id: string): void
  (e: 'update-maint', id: string, field: keyof MaintenanceEntry, val: string | number): void
  (e: 'add-rental'): void
  (e: 'remove-rental', id: string): void
  (e: 'update-rental', id: string, field: keyof RentalEntry, val: string | number): void
  (e: 'upload-maint-invoice', id: string, event: Event): void
  (e: 'upload-rental-invoice', id: string, event: Event): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function fmt(val: number | null | undefined): string {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <div class="section collapsible financial">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>💰 Cuentas</span>
      <span class="cost-badge">COSTE TOTAL: {{ fmt(totalCost) }}</span>
    </button>
    <div v-if="open" class="section-content">
      <div class="row-3">
        <div class="field">
          <label>Precio mínimo €</label>
          <input
            :value="minPrice"
            type="number"
            placeholder="Precio mínimo aceptable"
            @input="
              emit('update:minPrice', Number(($event.target as HTMLInputElement).value) || null)
            "
          >
        </div>
        <div class="field">
          <label>Coste adquisición €</label>
          <input
            :value="acquisitionCost"
            type="number"
            placeholder="Coste de compra"
            @input="
              emit(
                'update:acquisitionCost',
                Number(($event.target as HTMLInputElement).value) || null,
              )
            "
          >
        </div>
        <div class="field">
          <label>Fecha adquisición</label>
          <input
            :value="acquisitionDate"
            type="date"
            @input="
              emit('update:acquisitionDate', ($event.target as HTMLInputElement).value || null)
            "
          >
        </div>
      </div>

      <!-- Maintenance table -->
      <div class="records-block">
        <div class="records-header">
          <span>🔧 Mantenimiento (suma)</span>
          <button class="btn-add" @click="emit('add-maint')">+ Añadir</button>
        </div>
        <table v-if="maintenanceRecords?.length" class="records-table">
          <thead>
            <tr>
              <th>Fecha</th>
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
              <td class="invoice-cell">
                <template v-if="r.invoice_url">
                  <a
                    :href="r.invoice_url"
                    target="_blank"
                    rel="noopener"
                    class="invoice-link"
                    title="Ver factura"
                  >
                    📎 Ver
                  </a>
                  <label class="invoice-change" title="Cambiar factura">
                    ↻
                    <input type="file" @change="emit('upload-maint-invoice', r.id, $event)" >
                  </label>
                </template>
                <label v-else class="invoice-upload">
                  📎 Subir
                  <input
                    type="file"
                    :disabled="driveLoading"
                    @change="emit('upload-maint-invoice', r.id, $event)"
                  >
                </label>
              </td>
              <td><button class="btn-x" @click="emit('remove-maint', r.id)">×</button></td>
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
        <table v-if="rentalRecords?.length" class="records-table">
          <thead>
            <tr>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Razón</th>
              <th>Importe €</th>
              <th>Factura</th>
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
                    emit(
                      'update-rental',
                      r.id,
                      'to_date',
                      ($event.target as HTMLInputElement).value,
                    )
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
              <td class="invoice-cell">
                <template v-if="r.invoice_url">
                  <a
                    :href="r.invoice_url"
                    target="_blank"
                    rel="noopener"
                    class="invoice-link"
                    title="Ver factura"
                  >
                    📎 Ver
                  </a>
                  <label class="invoice-change" title="Cambiar factura">
                    ↻
                    <input type="file" @change="emit('upload-rental-invoice', r.id, $event)" >
                  </label>
                </template>
                <label v-else class="invoice-upload">
                  📎 Subir
                  <input
                    type="file"
                    :disabled="driveLoading"
                    @change="emit('upload-rental-invoice', r.id, $event)"
                  >
                </label>
              </td>
              <td><button class="btn-x" @click="emit('remove-rental', r.id)">×</button></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">Total Renta:</td>
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
          <span>Coste adquisición</span><span>{{ fmt(acquisitionCost) }}</span>
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
.section-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
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
.row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field input {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus {
  outline: none;
  border-color: #23424a;
}
.records-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
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
  padding: 6px 8px;
  background: #f3f4f6;
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
}
.records-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #f3f4f6;
}
.records-table input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  font-size: 0.75rem;
}
.records-table tfoot td {
  padding-top: 8px;
  border: none;
}
.text-right {
  text-align: right;
}
.invoice-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.invoice-link {
  color: #23424a;
  text-decoration: none;
  font-size: 0.75rem;
}
.invoice-link:hover {
  text-decoration: underline;
}
.invoice-upload,
.invoice-change {
  cursor: pointer;
  font-size: 0.7rem;
  color: #6b7280;
}
.invoice-upload:hover,
.invoice-change:hover {
  color: #23424a;
}
.invoice-upload input,
.invoice-change input {
  display: none;
}
.cost-summary {
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}
.cost-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
  padding: 4px 0;
}
.cost-row.total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-weight: 700;
  font-size: 0.9rem;
  color: #374151;
}
.green {
  color: #16a34a;
}
.btn-add {
  padding: 4px 10px;
  background: #23424a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-x {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
.empty-msg {
  text-align: center;
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 16px;
}

@media (max-width: 768px) {
  .row-3 {
    grid-template-columns: 1fr;
  }
  .records-table {
    font-size: 0.7rem;
  }
}
</style>
