<script setup lang="ts">
defineProps<{
  generatingPdf: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'generate-pdf' | 'save-quote'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="actions-bar">
    <button
      type="button"
      class="btn-primary"
      :disabled="generatingPdf"
      @click="emit('generate-pdf')"
    >
      {{ generatingPdf ? t('dashboard.quote.generating') : t('dashboard.quote.generatePdf') }}
    </button>
    <button type="button" class="btn-secondary" :disabled="saving" @click="emit('save-quote')">
      {{ saving ? t('dashboard.quote.saving') : t('dashboard.quote.saveQuote') }}
    </button>
  </div>
</template>

<style scoped>
.actions-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .actions-bar {
    flex-direction: row;
  }

  .actions-bar .btn-primary,
  .actions-bar .btn-secondary {
    flex: 1;
  }
}
</style>
