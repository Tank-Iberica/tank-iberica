<script setup lang="ts">
/**
 * UiFormField — Reusable form field wrapper with label, error, hint, and aria.
 *
 * Provides consistent layout and accessibility for all form inputs.
 * Handles aria-describedby, error/hint IDs, and required indicator.
 *
 * Backlog #304 — UiFormField.vue (label + input + error + hint + aria)
 *
 * @example
 * <UiFormField label="Email" :error="errors.email" hint="We'll never share your email">
 *   <input v-model="email" type="email" :aria-describedby="fieldId + '-hint ' + fieldId + '-error'" />
 * </UiFormField>
 */
const props = defineProps<{
  label: string
  error?: string | null
  hint?: string | null
  required?: boolean
  fieldId?: string
}>()

const autoId = useId()
const id = computed(() => props.fieldId || `field-${autoId}`)
</script>

<template>
  <div class="form-field" :class="{ 'form-field--error': !!error }">
    <label :for="id" class="form-field__label">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>

    <div class="form-field__input">
      <slot
        :id="id"
        :aria-invalid="!!error"
        :aria-describedby="
          [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') ||
          undefined
        "
      />
    </div>

    <p v-if="hint && !error" :id="`${id}-hint`" class="form-field__hint">
      {{ hint }}
    </p>

    <p v-if="error" :id="`${id}-error`" class="form-field__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1a1e1c);
}

.form-field__required {
  color: var(--error, #c23a3a);
  margin-inline-start: 0.125rem;
}

.form-field__hint {
  font-size: 0.75rem;
  color: var(--text-secondary, #4a524e);
  margin: 0;
}

.form-field__error {
  font-size: 0.75rem;
  color: var(--error, #c23a3a);
  margin: 0;
}

.form-field--error :deep(input),
.form-field--error :deep(select),
.form-field--error :deep(textarea) {
  border-color: var(--error, #c23a3a);
}
</style>
