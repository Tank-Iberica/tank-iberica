<script setup lang="ts">
defineProps<{
  isFullscreen: boolean
}>()

defineEmits<{
  (e: 'toggle-fullscreen' | 'open-export'): void
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
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
