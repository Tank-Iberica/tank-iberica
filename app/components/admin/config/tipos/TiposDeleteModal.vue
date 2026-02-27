<script setup lang="ts">
import type { DeleteModalState } from '~/composables/admin/useAdminTiposPage'

defineProps<{
  deleteModal: DeleteModalState
  saving: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
  (e: 'updateConfirmText', value: string): void
}>()

function onConfirmInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('updateConfirmText', target.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="deleteModal.show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>Confirmar eliminacion</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Estas seguro de eliminar el tipo
            <strong>{{ deleteModal.type?.name_es }}</strong
            >?
          </p>
          <p class="text-warning">Los vehiculos de este tipo quedaran sin clasificar.</p>
          <div class="form-group delete-confirm-group">
            <label for="delete-confirm">Escribe <strong>Borrar</strong> para confirmar:</label>
            <input
              id="delete-confirm"
              type="text"
              placeholder="Borrar"
              autocomplete="off"
              :value="deleteModal.confirmText"
              @input="onConfirmInput"
            >
            <p v-if="deleteModal.confirmText && !canDelete" class="text-error">
              Escribe "Borrar" exactamente para continuar
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button class="btn-danger" :disabled="saving || !canDelete" @click="emit('confirm')">
            {{ saving ? 'Eliminando...' : 'Eliminar' }}
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}

.text-warning {
  color: #d97706;
  font-size: 0.875rem;
  margin-top: 8px;
}

.text-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
}

.delete-confirm-group {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.delete-confirm-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-danger:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
}
</style>
