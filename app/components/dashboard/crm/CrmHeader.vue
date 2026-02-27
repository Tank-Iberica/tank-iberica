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
  gap: 12px;
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: #1a3238;
}

@media (min-width: 480px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
