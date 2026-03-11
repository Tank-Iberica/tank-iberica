<script setup lang="ts">
defineProps<{
  count: number
}>()

const emit = defineEmits<{
  create: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="page-header">
    <div class="header-left">
      <h1>{{ t('admin.subastas.title') }}</h1>
      <span class="count-badge">{{ count }}</span>
    </div>
    <button class="btn-primary" @click="emit('create')">+ {{ t('admin.subastas.create') }}</button>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  flex-direction: column;
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.count-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  min-height: 2.75rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

@media (min-width: 48em) {
  .page-header {
    flex-direction: row;
    gap: 0;
    align-items: center;
  }
}
</style>
