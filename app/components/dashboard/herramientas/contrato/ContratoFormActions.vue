<script setup lang="ts">
/**
 * ContratoFormActions
 * Jurisdiction field, feedback alerts, and generate contract button.
 */

defineProps<{
  contractJurisdiction: string
  saveError: string | null
  saveSuccess: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:contractJurisdiction', value: string): void
  (e: 'generate'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="contrato-form-actions">
    <!-- Jurisdiction -->
    <div class="form-row">
      <div class="form-group" style="max-width: 18.75rem">
        <label>{{ t('dashboard.tools.contract.jurisdiction') }}</label>
        <input
          :value="contractJurisdiction"
          type="text"
          @input="emit('update:contractJurisdiction', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="saveError" class="alert alert-error">{{ saveError }}</div>
    <div v-if="saveSuccess" class="alert alert-success">
      {{ t('dashboard.tools.contract.saved') }}
    </div>

    <!-- Generate Button -->
    <div class="form-actions">
      <button class="btn btn-primary btn-lg" :disabled="saving" @click="emit('generate')">
        <svg
          v-if="!saving"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span v-if="saving" class="spinner-sm" />
        {{
          saving ? t('dashboard.tools.contract.generating') : t('dashboard.tools.contract.generate')
        }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 7.5rem;
}

.form-group label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-group input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.alert-error {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
}

.alert-success {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
  border: 1px solid var(--color-success-border);
}

.btn {
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

.btn:hover {
  background: var(--color-gray-50);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-lg {
  padding: 0.875rem 1.75rem;
  font-size: var(--font-size-base);
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-sm {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 0.125rem solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-white);
  border-radius: var(--border-radius-full);
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.625rem;
}

@media (max-width: 48em) {
  .form-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
