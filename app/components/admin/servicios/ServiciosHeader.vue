<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t } = useI18n()
</script>

<template>
  <header class="page-header">
    <h1>{{ t('admin.servicios.title') }}</h1>
    <button class="btn-refresh" :disabled="loading" @click="emit('refresh')">
      {{ t('admin.servicios.refresh') }}
    </button>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-refresh {
  align-self: flex-start;
  padding: 0.625rem 1.125rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
}

.btn-refresh:hover {
  background: var(--color-primary-dark);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 48em) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-refresh {
    align-self: auto;
  }
}
</style>
