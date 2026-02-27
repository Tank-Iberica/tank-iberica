<script setup lang="ts">
const { t } = useI18n()

const emit = defineEmits<{
  (e: 'export'): void
}>()
</script>

<template>
  <header class="page-header">
    <div class="header-left">
      <h1>{{ t('billing.title') }}</h1>
    </div>
    <button class="btn-export" @click="emit('export')">
      {{ t('billing.exportCsv') }}
    </button>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3, 12px);
  align-items: stretch;
}

.header-left h1 {
  margin: 0;
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1e293b);
}

.btn-export {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2, 8px);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border: none;
  border-radius: var(--border-radius, 8px);
  font-weight: var(--font-weight-medium, 500);
  font-size: var(--font-size-sm, 0.875rem);
  cursor: pointer;
  transition: background var(--transition-fast, 150ms ease);
  min-height: 44px;
}

.btn-export:hover {
  background: var(--color-primary-dark, #1a3238);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
