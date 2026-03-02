<script setup lang="ts">
interface Props {
  saving: boolean
  uploadingImages: boolean
  isValid: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  save: []
  cancel: []
}>()
</script>

<template>
  <header class="pf-header">
    <div class="pf-left">
      <button class="btn-icon" @click="emit('cancel')">&#8592;</button>
      <h1>Nuevo Vehiculo</h1>
    </div>
    <div class="pf-right">
      <button class="btn" @click="emit('cancel')">Cancelar</button>
      <button
        class="btn btn-primary"
        :disabled="saving || uploadingImages || !isValid"
        @click="emit('save')"
      >
        <template v-if="uploadingImages">Subiendo imagenes...</template>
        <template v-else-if="saving">Guardando...</template>
        <template v-else>Guardar</template>
      </button>
    </div>
  </header>
</template>

<style scoped>
.pf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: #f9fafb;
  z-index: 50;
}
.pf-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pf-left h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
.pf-right {
  display: flex;
  gap: 8px;
}
.btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
  cursor: pointer;
}
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
