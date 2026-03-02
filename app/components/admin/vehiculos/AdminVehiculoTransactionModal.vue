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
            Vender
          </button>
          <button
            class="tx-tab"
            :class="{ active: tab === 'alquiler' }"
            @click="emit('update:tab', 'alquiler')"
          >
            Alquilar
          </button>
        </div>

        <!-- Sale form -->
        <div v-if="tab === 'venta'" class="tx-body">
          <div class="form-group">
            <label class="form-label">Precio de venta (&euro;) *</label>
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
            />
          </div>
          <div class="form-group">
            <label class="form-label">Categoría de venta *</label>
            <select
              class="form-select"
              required
              :value="sellForm.sale_category"
              @change="updateSellField('sale_category', ($event.target as HTMLSelectElement).value)"
            >
              <option value="">Seleccionar...</option>
              <option value="venta_directa">Venta directa</option>
              <option value="terceros">Terceros</option>
              <option value="exportacion">Exportación</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre comprador</label>
            <input
              :value="sellForm.buyer_name"
              type="text"
              class="form-input"
              @input="updateSellField('buyer_name', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Contacto comprador</label>
            <input
              :value="sellForm.buyer_contact"
              type="text"
              class="form-input"
              @input="updateSellField('buyer_contact', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <!-- Auto-balance info -->
          <div v-if="sellForm.sale_price > 0" class="tx-preview">
            <span class="tx-preview-label">Se creará automáticamente:</span>
            <span class="tx-preview-item ingreso">
              + {{ formatCurrency(sellForm.sale_price) }} ingreso en Balance
            </span>
            <span v-if="acquisitionCost" class="tx-preview-item">
              Beneficio: {{ calcBeneficio(sellForm.sale_price, acquisitionCost) }}
            </span>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="emit('close')">Cancelar</button>
            <button
              type="button"
              class="btn-primary btn-sell"
              :disabled="!sellForm.sale_price || !sellForm.sale_category || saving"
              @click="emit('sell')"
            >
              {{ saving ? 'Procesando...' : 'Confirmar venta' }}
            </button>
          </div>
        </div>

        <!-- Rental form -->
        <div v-if="tab === 'alquiler'" class="tx-body">
          <div class="form-group">
            <label class="form-label">Precio alquiler (&euro;/mes) *</label>
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
            />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Fecha inicio *</label>
              <input
                :value="rentalForm.start_date"
                type="date"
                class="form-input"
                required
                @input="updateRentalField('start_date', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha fin</label>
              <input
                :value="rentalForm.end_date"
                type="date"
                class="form-input"
                @input="updateRentalField('end_date', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre arrendatario</label>
            <input
              :value="rentalForm.renter_name"
              type="text"
              class="form-input"
              @input="updateRentalField('renter_name', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Contacto arrendatario</label>
            <input
              :value="rentalForm.renter_contact"
              type="text"
              class="form-input"
              @input="
                updateRentalField('renter_contact', ($event.target as HTMLInputElement).value)
              "
            />
          </div>
          <div class="form-group">
            <label class="form-label">Notas</label>
            <textarea
              :value="rentalForm.notes"
              class="form-textarea"
              rows="2"
              placeholder="Condiciones, fianza..."
              @input="updateRentalField('notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
          <!-- Auto-balance info -->
          <div v-if="rentalForm.monthly_price > 0" class="tx-preview">
            <span class="tx-preview-label">Se creará automáticamente:</span>
            <span class="tx-preview-item ingreso">
              + {{ formatCurrency(rentalForm.monthly_price) }}/mes ingreso recurrente en Balance
            </span>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="emit('close')">Cancelar</button>
            <button
              type="button"
              class="btn-primary btn-rent-action"
              :disabled="!rentalForm.monthly_price || !rentalForm.start_date || saving"
              @click="emit('rent')"
            >
              {{ saving ? 'Procesando...' : 'Confirmar alquiler' }}
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
  max-width: 400px;
  width: 100%;
}

.transaction-modal {
  max-width: 480px;
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
  border-bottom: 2px solid var(--border-color, #e5e7eb);
}

.tx-tab {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary, #9ca3af);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  min-height: 44px;
  transition: all 0.15s;
}

.tx-tab:hover {
  color: var(--text-primary);
  background: var(--bg-secondary, #f9fafb);
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
  min-height: 44px;
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
  min-height: 60px;
}

/* Transaction preview */
.tx-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, #dcfce7);
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius, 6px);
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm, 0.875rem);
}

.tx-preview-label {
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-secondary, #6b7280);
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
  min-height: 44px;
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
  background: #2563eb !important;
}

.btn-rent-action:hover:not(:disabled) {
  background: var(--color-info) !important;
}
</style>
