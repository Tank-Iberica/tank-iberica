<script setup lang="ts">
import type { SellFormField } from '~/composables/dashboard/useDashboardTransaccion'

const { t } = useI18n()

const props = defineProps<{
  saleDate: string
  buyerName: string
  buyerContact: string
  salePrice: number
  invoiceUrl: string
  exportacion: boolean
  submitting: boolean
  vehicleId: string
  totalCost: number
  estimatedBenefit: number
}>()

const emit = defineEmits<{
  (e: 'update', field: SellFormField, value: string | number | boolean): void
  (e: 'submit'): void
}>()

function onStringInput(field: SellFormField, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, target.value)
}

function onNumberInput(field: SellFormField, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, Number(target.value) || 0)
}

function onCheckboxChange(field: SellFormField, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, target.checked)
}
</script>

<template>
  <form class="transaction-form" @submit.prevent="emit('submit')">
    <section class="form-section">
      <h2>{{ t('dashboard.transaction.sell.title') }}</h2>

      <!-- Warning banner -->
      <div class="warning-banner">
        {{ t('dashboard.transaction.sell.warning') }}
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="sell-date">{{ t('dashboard.transaction.sell.saleDate') }} *</label>
          <input
            id="sell-date"
            :value="props.saleDate"
            type="date"
            required
            @input="onStringInput('sale_date', $event)"
          >
        </div>
        <div class="form-group">
          <label for="sell-price">{{ t('dashboard.transaction.sell.salePrice') }} *</label>
          <div class="input-with-suffix">
            <input
              id="sell-price"
              :value="props.salePrice"
              type="number"
              min="0"
              step="0.01"
              required
              @input="onNumberInput('sale_price', $event)"
            >
            <span class="input-suffix">EUR</span>
          </div>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="sell-buyer">{{ t('dashboard.transaction.sell.buyerName') }} *</label>
          <input
            id="sell-buyer"
            :value="props.buyerName"
            type="text"
            autocomplete="name"
            required
            @input="onStringInput('buyer_name', $event)"
          >
        </div>
        <div class="form-group">
          <label for="sell-contact">{{ t('dashboard.transaction.sell.buyerContact') }}</label>
          <input
            id="sell-contact"
            :value="props.buyerContact"
            type="text"
            autocomplete="off"
            @input="onStringInput('buyer_contact', $event)"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="sell-invoice">{{ t('dashboard.transaction.invoiceUrl') }}</label>
        <input
          id="sell-invoice"
          :value="props.invoiceUrl"
          type="url"
          :placeholder="t('dashboard.transaction.invoiceUrlPlaceholder')"
          @input="onStringInput('invoice_url', $event)"
        >
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            :checked="props.exportacion"
            type="checkbox"
            @change="onCheckboxChange('exportacion', $event)"
          >
          <span>{{ t('dashboard.transaction.sell.exportSale') }}</span>
        </label>
      </div>

      <!-- Benefit estimate -->
      <div v-if="props.salePrice > 0" class="benefit-summary">
        <div class="benefit-row">
          <span>{{ t('dashboard.transaction.sell.salePrice') }}</span>
          <span class="benefit-value positive">{{ props.salePrice.toLocaleString() }} EUR</span>
        </div>
        <div class="benefit-row">
          <span>{{ t('dashboard.transaction.sell.totalCost') }}</span>
          <span class="benefit-value">{{ props.totalCost.toLocaleString() }} EUR</span>
        </div>
        <div class="benefit-row benefit-total">
          <span>{{ t('dashboard.transaction.sell.estimatedBenefit') }}</span>
          <span
            class="benefit-value"
            :class="props.estimatedBenefit >= 0 ? 'positive' : 'negative'"
          >
            {{ props.estimatedBenefit.toLocaleString() }} EUR
          </span>
        </div>
      </div>
    </section>

    <div class="form-actions">
      <NuxtLink :to="`/dashboard/vehiculos/${props.vehicleId}`" class="btn-secondary">
        {{ t('common.cancel') }}
      </NuxtLink>
      <button type="submit" class="btn-danger" :disabled="props.submitting">
        {{ props.submitting ? t('common.loading') : t('dashboard.transaction.sell.submit') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-suffix input {
  padding-right: 52px;
}

.input-suffix {
  position: absolute;
  right: 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  pointer-events: none;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-height: 44px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
}

.checkbox-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  min-height: auto;
  accent-color: var(--color-primary, #23424a);
  cursor: pointer;
}

.warning-banner {
  padding: 14px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
}

.benefit-summary {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benefit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #475569;
}

.benefit-total {
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-weight: 700;
  font-size: 1rem;
  color: #1e293b;
}

.benefit-value {
  font-weight: 600;
}

.benefit-value.positive {
  color: #16a34a;
}

.benefit-value.negative {
  color: #dc2626;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.95rem;
}

@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
