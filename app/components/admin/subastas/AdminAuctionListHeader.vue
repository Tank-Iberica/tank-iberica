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
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  flex-direction: column;
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
  min-height: 44px;
}

.btn-primary:hover {
  background: #1a3238;
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    gap: 0;
    align-items: center;
  }
}
</style>
