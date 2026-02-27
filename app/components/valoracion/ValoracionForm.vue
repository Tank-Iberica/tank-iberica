<script setup lang="ts">
/**
 * Valuation form component.
 * Emits field updates individually (no v-model on props).
 */
import type { ValoracionSubcategoryRow, ValoracionFormData } from '~/composables/useValoracion'

const props = defineProps<{
  form: ValoracionFormData
  formErrors: Record<string, boolean>
  loading: boolean
  subcategories: ValoracionSubcategoryRow[]
  provinces: readonly string[]
  subcategoryLabel: (sub: ValoracionSubcategoryRow) => string
}>()

const emit = defineEmits<{
  submit: []
  'update:field': [field: keyof ValoracionFormData, value: string | number | null]
}>()

function onInput(field: keyof ValoracionFormData, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  emit('update:field', field, target.value)
}

function onNumberInput(field: keyof ValoracionFormData, event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = target.value
  emit('update:field', field, raw === '' ? null : Number(raw))
}
</script>

<template>
  <section class="valuation-form-section">
    <form class="valuation-form" @submit.prevent="emit('submit')">
      <!-- Brand -->
      <div class="form-group" :class="{ 'form-group--error': formErrors.brand }">
        <label for="val-brand" class="form-label">
          {{ $t('valuation.brand') }} <span class="required">*</span>
        </label>
        <input
          id="val-brand"
          type="text"
          class="form-input"
          :value="props.form.brand"
          :placeholder="$t('valuation.brandPlaceholder')"
          autocomplete="off"
          @input="onInput('brand', $event)"
        >
        <span v-if="formErrors.brand" class="form-error">{{ $t('valuation.requiredField') }}</span>
      </div>

      <!-- Model -->
      <div class="form-group" :class="{ 'form-group--error': formErrors.model }">
        <label for="val-model" class="form-label">
          {{ $t('valuation.model') }} <span class="required">*</span>
        </label>
        <input
          id="val-model"
          type="text"
          class="form-input"
          :value="props.form.model"
          :placeholder="$t('valuation.modelPlaceholder')"
          autocomplete="off"
          @input="onInput('model', $event)"
        >
        <span v-if="formErrors.model" class="form-error">{{ $t('valuation.requiredField') }}</span>
      </div>

      <!-- Year -->
      <div class="form-group" :class="{ 'form-group--error': formErrors.year }">
        <label for="val-year" class="form-label">
          {{ $t('valuation.year') }} <span class="required">*</span>
        </label>
        <input
          id="val-year"
          type="number"
          class="form-input"
          :value="props.form.year"
          :placeholder="$t('valuation.yearPlaceholder')"
          min="1970"
          :max="new Date().getFullYear() + 1"
          @input="onNumberInput('year', $event)"
        >
        <span v-if="formErrors.year" class="form-error">{{ $t('valuation.requiredField') }}</span>
      </div>

      <!-- Kilometres -->
      <div class="form-group">
        <label for="val-km" class="form-label">{{ $t('valuation.km') }}</label>
        <input
          id="val-km"
          type="number"
          class="form-input"
          :value="props.form.km"
          :placeholder="$t('valuation.kmPlaceholder')"
          min="0"
          @input="onNumberInput('km', $event)"
        >
      </div>

      <!-- Province -->
      <div class="form-group">
        <label for="val-province" class="form-label">{{ $t('valuation.province') }}</label>
        <select
          id="val-province"
          class="form-input form-select"
          :value="props.form.province"
          @change="onInput('province', $event)"
        >
          <option value="">{{ $t('valuation.provincePlaceholder') }}</option>
          <option v-for="prov in props.provinces" :key="prov" :value="prov">{{ prov }}</option>
        </select>
      </div>

      <!-- Subcategory -->
      <div class="form-group">
        <label for="val-subcategory" class="form-label">{{ $t('valuation.subcategory') }}</label>
        <select
          id="val-subcategory"
          class="form-input form-select"
          :value="props.form.subcategory"
          @change="onInput('subcategory', $event)"
        >
          <option value="">{{ $t('valuation.subcategoryPlaceholder') }}</option>
          <option v-for="sub in props.subcategories" :key="sub.id" :value="sub.slug">
            {{ props.subcategoryLabel(sub) }}
          </option>
        </select>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="val-email" class="form-label">{{ $t('valuation.email') }}</label>
        <input
          id="val-email"
          type="email"
          class="form-input"
          :value="props.form.email"
          :placeholder="$t('valuation.emailPlaceholder')"
          autocomplete="email"
          @input="onInput('email', $event)"
        >
        <span class="form-hint">{{ $t('valuation.emailHint') }}</span>
      </div>

      <!-- Submit -->
      <button type="submit" class="submit-btn" :disabled="props.loading">
        <span v-if="props.loading" class="spinner" aria-hidden="true" />
        {{ props.loading ? $t('valuation.calculating') : $t('valuation.calculate') }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.valuation-form-section {
  margin-top: calc(var(--spacing-6) * -1);
}

.valuation-form {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-group--error .form-input {
  border-color: var(--color-error);
}

.form-group--error .form-input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.required {
  color: var(--color-error);
}

.form-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 44px;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-input::placeholder {
  color: var(--text-disabled);
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--spacing-4) center;
  padding-right: var(--spacing-10);
  cursor: pointer;
}

.form-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.submit-btn {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  min-height: 48px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .valuation-form {
    padding: var(--spacing-8);
  }

  .valuation-form-section {
    margin-top: calc(var(--spacing-8) * -1);
  }
}
</style>
