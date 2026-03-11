<script setup lang="ts">
import type { SellFormData, RentalFormData } from '~/composables/admin/useAdminVehicleDetail'

const props = defineProps<{
  visible: boolean
  tab: 'venta' | 'alquiler'
  sellForm: SellFormData
  rentalForm: RentalFormData
  saving: boolean
  acquisitionCost: number | null | undefined
  formatCurrency: (val: number) => string
  calcBeneficio: (salePrice: number, cost: number | null | undefined) => string
}>()

const emit = defineEmits<{
  (e: 'close' | 'sell' | 'rent'): void
  (e: 'update:tab', value: 'venta' | 'alquiler'): void
  (e: 'update:sellForm', value: SellFormData): void
  (e: 'update:rentalForm', value: RentalFormData): void
}>()

// -----------------------------------------------------------------------
// Local helpers to update nested form fields without mutating the prop
// -----------------------------------------------------------------------

function updateSellField<K extends keyof SellFormData>(key: K, value: SellFormData[K]) {
  emit('update:sellForm', { ...props.sellForm, [key]: value })
}

function updateRentalField<K extends keyof RentalFormData>(key: K, value: RentalFormData[K]) {
  emit('update:rentalForm', { ...props.rentalForm, [key]: value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-content transaction-modal">
        <!-- Tabs -->
        <div class="tx-tabs">
          <button
            class="tx-tab"
            :class="{ active: tab === 'venta' }"
            @click="emit('update:tab', 'venta')"
          >
            {{ $t('admin.vehicles.tabSell') }}
          </button>
          <button
            class="tx-tab"
            :class="{ active: tab === 'alquiler' }"
            @click="emit('update:tab', 'alquiler')"
          >
            {{ $t('admin.vehicles.tabRent') }}
          </button>
        </div>

        <!-- Sale form -->
        <div v-if="tab === 'venta'" class="tx-body">
          <div class="form-group">
            <label class="form-label">{{ $t('admin.vehicles.salePriceLabel') }}</label>
            <input
              :value="sellForm.sale_price"
              type="number"
              class="form-input"
              min="0"
              required
              @input="
                updateSellField(
                  'sale_price',
                  Number(($event.target as HTMLInputElement).value) || 0,
                )
              "
            >
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('admin.vehicles.saleCategoryLabel') }}</label>
            <select
              class="form-select"
              required
              :value="sellForm.sale_category"
              @change="updateSellField('sale_category', ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ $t('admin.vehicles.saleCategorySelect') }}</option>
              <option value="venta_directa">{{ $t('admin.vehicles.saleCategoryDirect') }}</option>
              <option value="terceros">{{ $t('admin.vehicles.saleCategoryThirdParty') }}</option>
              <option value="exportacion">{{ $t('admin.vehicles.saleCategoryExport') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('admin.vehicles.buyerName') }}</label>
            <input
              :value="sellForm.buyer_name"
              type="text"
              class="form-input"
              @input="updateSellField('buyer_name', ($event.target as HTMLInputElement).value)"
            >
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('admin.vehicles.buyerContact') }}</label>
            <input
              :value="sellForm.buyer_contact"
              type="text"
              class="form-input"
              @input="updateSellField('buyer_contact', ($event.target as HTMLInputElement).value)"
            >
          </div>
          <!-- Auto-balance info -->
          <div v-if="sellForm.sale_price > 0" class="tx-preview">
            <span class="tx-preview-label">{{ $t('admin.vehicles.autoBalanceLabel') }}</span>
            <span class="tx-preview-item ingreso">
              {{ $t('admin.vehicles.balanceIncome', { amount: formatCurrency(sellForm.sale_price) }) }}
            </span>
            <span v-if="acquisitionCost" class="tx-preview-item">
              {{ $t('admin.vehicles.balanceProfit', { amount: calcBeneficio(sellForm.sale_price, acquisitionCost) }) }}
            </span>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
            <button
              type="button"
              class="btn-primary btn-sell"
              :disabled="!sellForm.sale_price || !sellForm.sale_category || saving"
              @click="emit('sell')"
            >
              {{ saving ? $t('common.processing') : $t('admin.vehicles.confirmSale') }}
            </button>
          </div>
        </div>

        <!-- Rental form -->
        <div v-if="tab === 'alquiler'" class="tx-body">
          <div class="form-group">
            <label class="form-label">{{ $t('admin.vehicles.rentalPriceLabel') }}</label>
            <input
              :value="rentalForm.monthly_price"
              type="number"
              class="form-input"
              min="0"
              required
              @input="
                updateRentalField(
                  'monthly_price',
                  Number(($event.target as HTMLInputElement).value) || 0,
                )
              "
            >
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">{{ $t('admin.vehicles.startDate') }}</label>
              <input
                :value="rentalForm.start_date"
                type="date"
                class="form-input"
                required
                @input="updateRentalField('start_date', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('admin.vehicles.endDate') }}</label>
              <input
                :value="rentalForm.end_date"
                type="date"
                class="form-input"
                @input="updateRentalField('end_date', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('admin.vehicles.renterName') }}</label>
            <input
              :value="rentalForm.renter_name"
              type="text"
              class="form-input"
              @input="updateRentalField('renter_name', ($event.target as HTMLInputElement).value)"
            >
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('admin.vehicles.renterContact') }}</label>
            <input
              :value="rentalForm.renter_contact"
              type="text"
              class="form-input"
              @input="
                updateRentalField('renter_contact', ($event.target as HTMLInputElement).value)
              "
            >
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('common.notes') }}</label>
            <textarea
              :value="rentalForm.notes"
              class="form-textarea"
              rows="2"
              :placeholder="$t('admin.vehicles.rentalNotesPlaceholder')"
              @input="updateRentalField('notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
          <!-- Auto-balance info -->
          <div v-if="rentalForm.monthly_price > 0" class="tx-preview">
            <span class="tx-preview-label">{{ $t('admin.vehicles.autoBalanceLabel') }}</span>
            <span class="tx-preview-item ingreso">
              {{ $t('admin.vehicles.balanceRecurringIncome', { amount: formatCurrency(rentalForm.monthly_price) }) }}
            </span>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
            <button
              type="button"
              class="btn-primary btn-rent-action"
              :disabled="!rentalForm.monthly_price || !rentalForm.start_date || saving"
              @click="emit('rent')"
            >
              {{ saving ? $t('common.processing') : $t('admin.vehicles.confirmRental') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  max-width: 25rem;
  width: 100%;
}

.transaction-modal {
  max-width: 30em;
}

.transaction-modal .form-group {
  margin-bottom: var(--spacing-4);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
  margin-top: var(--spacing-6);
}

/* Tabs */
.tx-tabs {
  display: flex;
  border-bottom: 2px solid var(--border-color, var(--color-gray-200));
}

.tx-tab {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary, var(--color-gray-400));
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -0.125rem;
  min-height: 2.75rem;
  transition: all 0.15s;
}

.tx-tab:hover {
  color: var(--text-primary);
  background: var(--bg-secondary, var(--color-gray-50));
}

.tx-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tx-body {
  padding: var(--spacing-6);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

/* Form fields */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input,
.form-select,
.form-textarea {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 2.75rem;
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 3.75rem;
}

/* Transaction preview */
.tx-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius, 6px);
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm, 0.875rem);
}

.tx-preview-label {
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-secondary, var(--color-gray-500));
  font-size: 0.75rem;
  text-transform: uppercase;
}

.tx-preview-item {
  color: var(--text-primary, #111);
}

.tx-preview-item.ingreso {
  color: var(--color-success);
  font-weight: 600;
}

/* Buttons */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius);
  min-height: 2.75rem;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-sell {
  background: var(--color-primary) !important;
}

.btn-rent-action {
  background: var(--color-focus) !important;
}

.btn-rent-action:hover:not(:disabled) {
  background: var(--color-info) !important;
}
</style>
