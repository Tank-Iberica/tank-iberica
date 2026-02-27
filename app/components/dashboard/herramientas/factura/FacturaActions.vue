<script setup lang="ts">
defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'generate-pdf' | 'save-draft' | 'reset'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="invoice-actions">
    <button class="btn btn--primary" type="button" :disabled="saving" @click="emit('generate-pdf')">
      <svg
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
      {{ t('dashboard.tools.invoice.generatePDF') }}
    </button>
    <button class="btn btn--secondary" type="button" :disabled="saving" @click="emit('save-draft')">
      {{ t('dashboard.tools.invoice.saveDraft') }}
    </button>
    <button class="btn btn--ghost" type="button" @click="emit('reset')">
      {{ t('dashboard.tools.invoice.reset') }}
    </button>
  </div>
</template>

<style scoped>
.invoice-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background 0.2s;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--primary, #23424a);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--secondary {
  background: #e2e8f0;
  color: #334155;
}

.btn--secondary:hover:not(:disabled) {
  background: #cbd5e1;
}

.btn--ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #d1d5db;
}

.btn--ghost:hover:not(:disabled) {
  background: #f1f5f9;
}
</style>
