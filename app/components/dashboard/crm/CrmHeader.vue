<script setup lang="ts">
/**
 * CRM page header with title, contact count badge, and "New Contact" button.
 */
defineProps<{
  total: number
}>()

const emit = defineEmits<{
  create: []
}>()

const { t } = useI18n()
</script>

<template>
  <header class="page-header">
    <div class="header-left">
      <h1>{{ t('dashboard.crm.title') }}</h1>
      <span class="count-badge">{{ total }}</span>
    </div>
    <button class="btn-primary" @click="emit('create')">
      {{ t('dashboard.crm.newContact') }}
    </button>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.count-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  padding: 0.25rem 0.625rem;
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
  white-space: nowrap;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

@media (min-width: 30em) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
