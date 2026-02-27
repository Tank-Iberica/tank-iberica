<script setup lang="ts">
defineProps<{
  total: number
}>()

defineEmits<{
  (e: 'export'): void
}>()
</script>

<template>
  <div class="section-header">
    <div class="header-left">
      <h2>Usuarios</h2>
      <span class="total-badge">{{ total }} registros</span>
    </div>
    <button class="btn-export" @click="$emit('export')">Exportar CSV</button>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.btn-export {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-export:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }
}
</style>
