<script setup lang="ts">
/* eslint-disable @typescript-eslint/unified-signatures */
import type { MaintenanceEntry, RentalEntry } from '~/composables/admin/useAdminVehicles'
import type { FileNamingData } from '~/utils/fileNaming'

const { t } = useI18n()

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
      <span>💰 {{ t('admin.productos.financial.accounts') }}</span>
      <span class="cost-badge">{{ t('admin.productos.financial.totalCost') }}: {{ fmt(totalCost) }}</span>
    </button>
    <div v-if="open" class="section-content">
      <div class="row-3">
        <div class="field">
          <label>{{ t('admin.productos.financial.minPrice') }}</label>
          <input
            :value="minPrice"
            type="number"
            :placeholder="t('admin.productos.financial.minPricePlaceholder')"
            @input="
              emit('update:minPrice', Number(($event.target as HTMLInputElement).value) || null)
            "
          />
        </div>
        <div class="field">
          <label>{{ t('admin.productos.financial.acquisitionCost') }}</label>
          <input
            :value="acquisitionCost"
            type="number"
            :placeholder="t('admin.productos.financial.purchaseCostPlaceholder')"
            @input="
              emit(
                'update:acquisitionCost',
                Number(($event.target as HTMLInputElement).value) || null,
              )
            "
          />
        </div>
        <div class="field">
          <label>{{ t('admin.productos.financial.acquisitionDate') }}</label>
          <input
            :value="acquisitionDate"
            type="date"
            @input="
              emit('update:acquisitionDate', ($event.target as HTMLInputElement).value || null)
            "
          />
        </div>
      </div>

      <!-- Maintenance table -->
      <div class="records-block">
        <div class="records-header">
          <span>🔧 {{ t('admin.productos.financial.maintenanceSum') }}</span>
          <button class="btn-add" @click="emit('add-maint')">+ {{ t('common.add') }}</button>
        </div>
        <table v-if="maintenanceRecords?.length" class="records-table">
          <thead>
            <tr>
              <th>{{ $t('common.date') }}</th>
              <th>{{ t('admin.productos.financial.reason') }}</th>
              <th>{{ t('admin.productos.financial.costEur') }}</th>
              <th>{{ t('admin.productos.financial.invoice') }}</th>
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
                />
              </td>
              <td>
                <input
                  type="text"
                  :value="r.reason"
                  :placeholder="t('admin.productos.financial.reason')"
                  @input="
                    emit('update-maint', r.id, 'reason', ($event.target as HTMLInputElement).value)
                  "
                />
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
                />
              </td>
              <td class="invoice-cell">
                <template v-if="r.invoice_url">
                  <a
                    :href="r.invoice_url"
                    target="_blank"
                    rel="noopener"
                    class="invoice-link"
                    :title="t('admin.productos.financial.viewInvoice')"
                  >
                    📎 {{ t('common.view') }}
                  </a>
                  <label class="invoice-change" :title="t('admin.productos.financial.changeInvoice')">
                    ↻
                    <input type="file" @change="emit('upload-maint-invoice', r.id, $event)" />
                  </label>
                </template>
                <label v-else class="invoice-upload">
                  📎 {{ t('common.upload') }}
                  <input
                    type="file"
                    :disabled="driveLoading"
                    @change="emit('upload-maint-invoice', r.id, $event)"
                  />
                </label>
              </td>
              <td><button class="btn-x" :aria-label="$t('common.delete')" @click="emit('remove-maint', r.id)">×</button></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="text-right">{{ t('admin.productos.financial.totalMaint') }}:</td>
              <td colspan="3">
                <strong>{{ fmt(totalMaint) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
        <div v-else class="empty-msg">{{ t('admin.productos.financial.noMaintenanceRecords') }}</div>
      </div>

      <!-- Rental income table -->
      <div class="records-block">
        <div class="records-header">
          <span>📅 {{ t('admin.productos.financial.rentalSubtracts') }}</span>
          <button class="btn-add" @click="emit('add-rental')">+ {{ t('common.add') }}</button>
        </div>
        <table v-if="rentalRecords?.length" class="records-table">
          <thead>
            <tr>
              <th>{{ t('common.from') }}</th>
              <th>{{ t('common.to') }}</th>
              <th>{{ t('admin.productos.financial.reason') }}</th>
              <th>{{ t('admin.productos.financial.amountEur') }}</th>
              <th>{{ t('admin.productos.financial.invoice') }}</th>
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
                />
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
                />
              </td>
              <td>
                <input
                  type="text"
                  :value="r.notes"
                  :placeholder="t('admin.productos.financial.reason')"
                  @input="
                    emit('update-rental', r.id, 'notes', ($event.target as HTMLInputElement).value)
                  "
                />
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
                />
              </td>
              <td class="invoice-cell">
                <template v-if="r.invoice_url">
                  <a
                    :href="r.invoice_url"
                    target="_blank"
                    rel="noopener"
                    class="invoice-link"
                    :title="t('admin.productos.financial.viewInvoice')"
                  >
                    📎 {{ t('common.view') }}
                  </a>
                  <label class="invoice-change" :title="t('admin.productos.financial.changeInvoice')">
                    ↻
                    <input type="file" @change="emit('upload-rental-invoice', r.id, $event)" />
                  </label>
                </template>
                <label v-else class="invoice-upload">
                  📎 {{ t('common.upload') }}
                  <input
                    type="file"
                    :disabled="driveLoading"
                    @change="emit('upload-rental-invoice', r.id, $event)"
                  />
                </label>
              </td>
              <td><button class="btn-x" :aria-label="$t('common.delete')" @click="emit('remove-rental', r.id)">×</button></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">{{ t('admin.productos.financial.totalRental') }}:</td>
              <td colspan="2">
                <strong class="green">{{ fmt(totalRental) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
        <div v-else class="empty-msg">{{ t('admin.productos.financial.noRentalRecords') }}</div>
      </div>

      <!-- Cost summary -->
      <div class="cost-summary">
        <div class="cost-row">
          <span>{{ t('admin.productos.financial.acquisitionCostLabel') }}</span><span>{{ fmt(acquisitionCost) }}</span>
        </div>
        <div class="cost-row">
          <span>+ {{ t('admin.productos.financial.maintenanceLabel') }}</span><span>{{ fmt(totalMaint) }}</span>
        </div>
        <div class="cost-row">
          <span>− {{ t('admin.productos.financial.rentalLabel') }}</span><span class="green">{{ fmt(totalRental) }}</span>
        </div>
        <div class="cost-row total">
          <span>{{ t('admin.productos.financial.totalCost') }}</span><span>{{ fmt(totalCost) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
  text-transform: uppercase;
}
.section-toggle:hover {
  background: var(--color-gray-50);
}
.section-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}
.financial {
  border: 1px solid var(--border-color);
}
.cost-badge {
  padding: var(--spacing-1) 0.625rem;
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}
.row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-3);
}
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
.invoice-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}
.invoice-link {
  color: var(--color-primary);
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
  color: var(--color-gray-500);
}
.invoice-upload:hover,
.invoice-change:hover {
  color: var(--color-primary);
}
.invoice-upload input,
.invoice-change input {
  display: none;
}
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
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: var(--spacing-4);
}

@media (max-width: 48em) {
  .row-3 {
    grid-template-columns: 1fr;
  }
  .records-table {
    font-size: 0.7rem;
  }
}
</style>
