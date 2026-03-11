<script setup lang="ts">
defineProps<{
  isFullscreen: boolean
}>()

defineEmits<{
  'toggle-fullscreen': []
  'open-export': []
}>()
</script>

<template>
  <header class="page-header">
    <h1>📜 Histórico de Ventas</h1>
    <div class="header-actions">
      <button
        class="btn btn-icon-only"
        title="Pantalla completa"
        @click="$emit('toggle-fullscreen')"
      >
        ⛶
      </button>
      <button class="btn" @click="$emit('open-export')">📥 Exportar</button>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-5);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}
.header-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-icon-only {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

@media (max-width: 48em) {
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
