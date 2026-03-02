<script setup lang="ts">
defineProps<{
  show: boolean
  vehicle: { id: string; brand: string; model: string } | null
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-content">
        <h3 class="modal-title">Eliminar vehículo</h3>
        <p class="modal-text">
          ¿Estás seguro de que quieres eliminar
          <strong>{{ vehicle?.brand }} {{ vehicle?.model }}</strong
          >? Esta acción no se puede deshacer.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button class="btn-danger" :disabled="saving" @click="emit('confirm')">
            {{ saving ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  max-width: 400px;
  width: 100%;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
}

.modal-text {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-6);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

.btn-secondary {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 40px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-danger {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-error);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 40px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
