<script setup lang="ts">
defineProps<{
  total: number
}>()

defineEmits<{
  export: []
}>()
</script>

<template>
  <div class="section-header">
    <div class="header-left">
      <h2>Usuarios</h2>
      <span class="total-badge">{{ total }} registros</span>
    </div>
    <button class="btn-export" @click="$emit('export')">{{ $t('common.exportCsv') }}</button>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
  padding: 0.375rem var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.85rem;
}

.btn-export {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-export:hover {
  opacity: 0.9;
}

@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }
}
</style>
