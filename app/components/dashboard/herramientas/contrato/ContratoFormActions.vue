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
      <div class="form-group" style="max-width: 300px">
        <label>{{ t('dashboard.tools.contract.jurisdiction') }}</label>
        <input
          :value="contractJurisdiction"
          type="text"
          @input="emit('update:contractJurisdiction', ($event.target as HTMLInputElement).value)"
        >
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
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 44px;
}

.form-group input:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.btn {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
