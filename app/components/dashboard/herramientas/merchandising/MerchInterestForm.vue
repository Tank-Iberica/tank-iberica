<script setup lang="ts">
import { products } from '~/composables/dashboard/useDashboardMerchandising'
import type { MerchForm, MerchProduct } from '~/composables/dashboard/useDashboardMerchandising'

defineProps<{
  submitted: boolean
  submitting: boolean
  submitError: string | null
  form: MerchForm
}>()

const emit = defineEmits<{
  (e: 'submit' | 'reset'): void
  (e: 'update-field', field: keyof MerchForm, value: string): void
}>()

const { locale } = useI18n()

function getProductName(p: MerchProduct): string {
  return locale.value === 'en' ? p.name_en : p.name_es
}

function onInput(field: keyof MerchForm, event: Event) {
  emit('update-field', field, (event.target as HTMLInputElement).value)
}

function onChange(field: keyof MerchForm, event: Event) {
  emit('update-field', field, (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <section class="section form-section">
    <h2 class="section-title">{{ $t('dashboard.tools.merchandising.formTitle') }}</h2>
    <p class="section-desc">{{ $t('dashboard.tools.merchandising.formDesc') }}</p>

    <!-- Success state -->
    <div v-if="submitted" class="alert-success">
      <strong>{{ $t('dashboard.tools.merchandising.successTitle') }}</strong>
      <p>{{ $t('dashboard.tools.merchandising.successDesc') }}</p>
      <button class="btn-reset" @click="emit('reset')">
        {{ $t('dashboard.tools.merchandising.sendAnother') }}
      </button>
    </div>

    <!-- Form -->
    <form v-else class="interest-form" novalidate @submit.prevent="emit('submit')">
      <div class="field">
        <label class="field-label" for="merch-product">
          {{ $t('dashboard.tools.merchandising.fieldProduct') }}
          <span class="required" aria-hidden="true">*</span>
        </label>
        <select
          id="merch-product"
          class="field-input"
          :value="form.product"
          required
          @change="onChange('product', $event)"
        >
          <option value="" disabled>
            {{ $t('dashboard.tools.merchandising.productPlaceholder') }}
          </option>
          <option v-for="product in products" :key="product.id" :value="product.id">
            {{ getProductName(product) }}
          </option>
        </select>
      </div>

      <div class="field">
        <label class="field-label" for="merch-quantity">
          {{ $t('dashboard.tools.merchandising.fieldQuantity') }}
        </label>
        <input
          id="merch-quantity"
          type="text"
          class="field-input"
          :value="form.quantity"
          :placeholder="$t('dashboard.tools.merchandising.quantityPlaceholder')"
          @input="onInput('quantity', $event)"
        >
      </div>

      <div class="field">
        <label class="field-label" for="merch-email">
          {{ $t('dashboard.tools.merchandising.fieldEmail') }}
          <span class="required" aria-hidden="true">*</span>
        </label>
        <input
          id="merch-email"
          type="email"
          class="field-input"
          autocomplete="email"
          :value="form.email"
          :placeholder="$t('dashboard.tools.merchandising.emailPlaceholder')"
          required
          @input="onInput('email', $event)"
        >
      </div>

      <div class="field">
        <label class="field-label" for="merch-notes">
          {{ $t('dashboard.tools.merchandising.fieldNotes') }}
        </label>
        <textarea
          id="merch-notes"
          class="field-input field-textarea"
          rows="3"
          :value="form.notes"
          :placeholder="$t('dashboard.tools.merchandising.notesPlaceholder')"
          @input="onInput('notes', $event)"
        />
      </div>

      <div v-if="submitError" class="alert-error">{{ submitError }}</div>

      <button type="submit" class="btn-submit" :disabled="submitting">
        <span v-if="submitting" class="spinner-sm" aria-hidden="true" />
        {{ submitting ? $t('common.saving') : $t('dashboard.tools.merchandising.submitBtn') }}
      </button>

      <p class="form-note">{{ $t('dashboard.tools.merchandising.formNote') }}</p>
    </form>
  </section>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.section-desc {
  margin: -8px 0 0;
  font-size: 0.875rem;
  color: var(--text-auxiliary);
  line-height: 1.5;
}

.form-section {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  border: 1px solid var(--color-gray-200);
}

.interest-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: var(--color-error);
  margin-left: 2px;
}

.field-input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.12);
}

.field-textarea {
  min-height: 88px;
  resize: vertical;
}

.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.875rem;
}

.alert-success {
  padding: 20px;
  background: var(--color-success-bg, #dcfce7);
  border: 1px solid var(--color-success-border);
  border-radius: 12px;
  color: #15803d;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-success strong {
  font-size: 1rem;
  font-weight: 700;
}

.alert-success p {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  width: 100%;
}

.btn-submit:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  background: transparent;
  color: #15803d;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.15s;
}

.btn-reset:hover {
  background: var(--color-success-bg, #dcfce7);
}

.form-note {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-disabled);
  text-align: center;
  font-style: italic;
}

@media (min-width: 480px) {
  .btn-submit {
    width: auto;
    align-self: flex-start;
  }
}

@media (min-width: 768px) {
  .form-section {
    padding: 32px;
  }
}
</style>
