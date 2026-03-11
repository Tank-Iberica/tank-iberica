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
      <button class="btn" @click="emit('cancel')">{{ $t('common.cancel') }}</button>
      <button
        class="btn btn-primary"
        :disabled="saving || uploadingImages || !isValid"
        @click="emit('save')"
      >
        <template v-if="uploadingImages">Subiendo imagenes...</template>
        <template v-else-if="saving">Guardando...</template>
        <template v-else>{{ $t('common.save') }}</template>
      </button>
    </div>
  </header>
</template>

<style scoped>
.pf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-gray-200);
  margin-bottom: var(--spacing-4);
  position: sticky;
  top: 0;
  background: var(--color-gray-50);
  z-index: 50;
}
.pf-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.pf-left h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
.pf-right {
  display: flex;
  gap: var(--spacing-2);
}
.btn-icon {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  cursor: pointer;
}
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
