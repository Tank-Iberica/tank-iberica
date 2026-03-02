<script setup lang="ts">
import type { AdminVehicle } from '~/composables/admin/useAdminVehicles'

const props = defineProps<{
  show: boolean
  vehicle: AdminVehicle | null
  confirmText: string
}>()

const emit = defineEmits<{
  'update:confirmText': [text: string]
  close: []
  confirm: []
}>()

const localConfirmText = computed({
  get: () => props.confirmText,
  set: (val) => emit('update:confirmText', val),
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header danger">
          <h3>Eliminar producto</h3>
          <button class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <p>
            ¿Eliminar <strong>{{ vehicle?.brand }} {{ vehicle?.model }}</strong
            >?
          </p>
          <p class="text-danger">
            Se eliminarán también las imágenes. Esta acción no se puede deshacer.
          </p>
          <div class="form-group">
            <label>Escribe <strong>borrar</strong> para confirmar:</label>
            <input v-model="localConfirmText" type="text" placeholder="borrar" autocomplete="off" >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button
            class="btn-danger"
            :disabled="localConfirmText.toLowerCase() !== 'borrar'"
            @click="emit('confirm')"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow: auto;
  animation: modalSlide 0.2s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-sm {
  width: 100%;
  max-width: 480px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header.danger {
  background: var(--color-error-bg, #fef2f2);
  border-color: var(--color-error-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-header.danger h3 {
  color: var(--color-error);
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-disabled);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0 0 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.text-danger {
  color: var(--color-error);
  font-size: 14px;
}

.form-group {
  margin-top: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  color: var(--text-secondary);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
