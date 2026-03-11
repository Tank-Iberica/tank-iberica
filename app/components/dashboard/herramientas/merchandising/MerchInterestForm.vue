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
        />
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
        />
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
  gap: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.section-desc {
  margin: -0.5rem 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  line-height: 1.5;
}

.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  border: 1px solid var(--color-gray-200);
}

.interest-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.required {
  color: var(--color-error);
  margin-left: 0.125rem;
}

.field-input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
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
  min-height: 5.5rem;
  resize: vertical;
}

.alert-error {
  padding: 0.75rem 1rem;
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.alert-success {
  padding: 1.25rem;
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius-md);
  color: var(--color-green-700);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-success strong {
  font-size: var(--font-size-base);
  font-weight: 700;
}

.alert-success p {
  margin: 0;
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
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
  width: 1rem;
  height: 1rem;
  border: 0.125rem solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: var(--border-radius-full);
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
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  background: transparent;
  color: var(--color-green-700);
  border: 1px solid var(--color-green-300);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.15s;
}

.btn-reset:hover {
  background: var(--color-success-bg, var(--color-success-bg));
}

.form-note {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-disabled);
  text-align: center;
  font-style: italic;
}

@media (min-width: 30em) {
  .btn-submit {
    width: auto;
    align-self: flex-start;
  }
}

@media (min-width: 48em) {
  .form-section {
    padding: 2rem;
  }
}
</style>
