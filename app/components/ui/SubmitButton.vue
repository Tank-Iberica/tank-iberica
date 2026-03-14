<script setup lang="ts">
/**
 * UiSubmitButton — Reusable submit button with loading state.
 * Shows a spinner when loading, disabled when submitting, configurable text.
 */
withDefaults(
  defineProps<{
    /** Whether the action is in progress */
    loading?: boolean
    /** Whether the button is disabled (independent of loading) */
    disabled?: boolean
    /** Button text when idle */
    label?: string
    /** Button text when loading (defaults to label) */
    loadingLabel?: string
    /** Visual variant */
    variant?: 'primary' | 'secondary' | 'outline' | 'danger'
    /** HTML button type */
    type?: 'button' | 'submit'
  }>(),
  {
    loading: false,
    disabled: false,
    label: '',
    loadingLabel: '',
    variant: 'primary',
    type: 'button',
  },
)

defineEmits<{
  click: [event: MouseEvent]
}>()

const { t } = useI18n()
</script>

<template>
  <button
    :type="type"
    :class="['submit-btn', `submit-btn--${variant}`]"
    :disabled="loading || disabled"
    :aria-busy="loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="submit-btn__spinner" aria-hidden="true" />
    <span class="submit-btn__text">
      {{ loading ? loadingLabel || label || t('common.loading') : label || t('common.save') }}
    </span>
  </button>
</template>

<style scoped>
.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s;
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Variants */
.submit-btn--primary {
  background: var(--color-primary);
  color: white;
}

@media (hover: hover) {
  .submit-btn--primary:not(:disabled):hover {
    background: var(--color-primary-dark);
  }
}

.submit-btn--secondary {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
}

@media (hover: hover) {
  .submit-btn--secondary:not(:disabled):hover {
    background: var(--color-gray-100);
  }
}

.submit-btn--outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

@media (hover: hover) {
  .submit-btn--outline:not(:disabled):hover {
    background: var(--color-primary);
    color: white;
  }
}

.submit-btn--danger {
  background: var(--color-error);
  color: white;
}

@media (hover: hover) {
  .submit-btn--danger:not(:disabled):hover {
    opacity: 0.85;
  }
}

/* Spinner */
.submit-btn__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: submit-spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes submit-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
