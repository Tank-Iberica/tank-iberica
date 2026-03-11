<script setup lang="ts">
import type { RentFormField } from '~/composables/dashboard/useDashboardTransaccion'

const { t } = useI18n()

const props = defineProps<{
  fromDate: string
  toDate: string
  clientName: string
  clientContact: string
  amount: number
  invoiceUrl: string
  notes: string
  submitting: boolean
  vehicleId: string
}>()

const emit = defineEmits<{
  (e: 'update', field: RentFormField, value: string | number): void
  (e: 'submit'): void
}>()

function onStringInput(field: RentFormField, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update', field, target.value)
}

function onNumberInput(field: RentFormField, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, Number(target.value) || 0)
}
</script>

<template>
  <form class="transaction-form" @submit.prevent="emit('submit')">
    <section class="form-section">
      <h2>{{ t('dashboard.transaction.rent.title') }}</h2>

      <div class="form-grid">
        <div class="form-group">
          <label for="rent-from">{{ t('dashboard.transaction.rent.fromDate') }} *</label>
          <input
            id="rent-from"
            :value="props.fromDate"
            type="date"
            required
            @input="onStringInput('from_date', $event)"
          >
        </div>
        <div class="form-group">
          <label for="rent-to">{{ t('dashboard.transaction.rent.toDate') }} *</label>
          <input
            id="rent-to"
            :value="props.toDate"
            type="date"
            required
            @input="onStringInput('to_date', $event)"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="rent-client">{{ t('dashboard.transaction.rent.clientName') }} *</label>
          <input
            id="rent-client"
            :value="props.clientName"
            type="text"
            autocomplete="name"
            required
            @input="onStringInput('client_name', $event)"
          >
        </div>
        <div class="form-group">
          <label for="rent-contact">{{ t('dashboard.transaction.rent.clientContact') }}</label>
          <input
            id="rent-contact"
            :value="props.clientContact"
            type="text"
            autocomplete="off"
            @input="onStringInput('client_contact', $event)"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="rent-amount">{{ t('dashboard.transaction.rent.amount') }} *</label>
          <div class="input-with-suffix">
            <input
              id="rent-amount"
              :value="props.amount"
              type="number"
              min="0"
              step="0.01"
              required
              @input="onNumberInput('amount', $event)"
            >
            <span class="input-suffix">EUR</span>
          </div>
        </div>
        <div class="form-group">
          <label for="rent-invoice">{{ t('dashboard.transaction.invoiceUrl') }}</label>
          <input
            id="rent-invoice"
            :value="props.invoiceUrl"
            type="url"
            :placeholder="t('dashboard.transaction.invoiceUrlPlaceholder')"
            @input="onStringInput('invoice_url', $event)"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="rent-notes">{{ t('dashboard.transaction.notes') }}</label>
        <textarea
          id="rent-notes"
          :value="props.notes"
          rows="3"
          :placeholder="t('dashboard.transaction.notesPlaceholder')"
          @input="onStringInput('notes', $event)"
        />
      </div>
    </section>

    <div class="form-actions">
      <NuxtLink :to="`/dashboard/vehiculos/${props.vehicleId}`" class="btn-secondary">
        {{ t('common.cancel') }}
      </NuxtLink>
      <button type="submit" class="btn-primary" :disabled="props.submitting">
        {{ props.submitting ? t('common.loading') : t('dashboard.transaction.rent.submit') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-group textarea {
  resize: vertical;
  min-height: 5rem;
}

.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-suffix input {
  padding-right: 3.25rem;
}

.input-suffix {
  position: absolute;
  right: 0.875rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-disabled);
  pointer-events: none;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  font-size: 0.95rem;
}

@media (min-width: 30em) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
