<script setup lang="ts">
import type { DeleteModalState } from '~/composables/admin/useAdminSubcategoriasPage'

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
    <div v-if="deleteModal.show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>Confirmar eliminaci&#xF3;n</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            &#xBF;Est&#xE1;s seguro de eliminar la subcategoria
            <strong>{{ deleteModal.subcategory?.name_es }}</strong
            >?
          </p>
          <p class="text-warning">
            Los tipos vinculados a esta subcategoria perder&#xE1;n esa asociaci&#xF3;n.
          </p>
          <div class="form-group delete-confirm-group">
            <label for="delete-confirm">Escribe <strong>Borrar</strong> para confirmar:</label>
            <input
              id="delete-confirm"
              type="text"
              placeholder="Borrar"
              autocomplete="off"
              :value="deleteModal.confirmText"
              @input="onConfirmInput"
            />
            <p v-if="deleteModal.confirmText && !canDelete" class="text-error">
              Escribe "Borrar" exactamente para continuar
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn-danger" :disabled="saving || !canDelete" @click="emit('confirm')">
            {{ saving ? $t('common.deleting') : $t('common.delete') }}
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
  padding: 1.25rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 34.375rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-small {
  max-width: 25rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-gray-500);
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-gray-700);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--bg-tertiary);
  background: var(--color-gray-50);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--color-gray-700);
}

.text-warning {
  color: var(--color-warning);
  font-size: 0.875rem;
  margin-top: var(--spacing-2);
}

.text-error {
  color: var(--color-error);
  font-size: 0.75rem;
  margin-top: var(--spacing-1);
}

.delete-confirm-group {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--bg-tertiary);
}

.delete-confirm-group input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: var(--color-error);
  box-shadow: var(--shadow-focus-error);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--border-color);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
}

.btn-danger:hover {
  background: var(--color-error);
}

@media (max-width: 48em) {
  .modal-content {
    margin: 0.625rem;
    max-height: calc(100vh - 1.25rem);
  }
}
</style>
