<script setup lang="ts">
defineProps<{
  generatingPdf: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  'generate-pdf': []
  'save-quote': []
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
  gap: 0.75rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-base);
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
  min-height: 3rem;
  padding: 0.75rem 1.5rem;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-base);
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

@media (min-width: 48em) {
  .actions-bar {
    flex-direction: row;
  }

  .actions-bar .btn-primary,
  .actions-bar .btn-secondary {
    flex: 1;
  }
}
</style>
