<script setup lang="ts">
import type { AdminSubscription } from '~/composables/admin/useAdminSubscriptions'

defineProps<{
  show: boolean
  subscription: AdminSubscription | null
  confirmText: string
  canDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
  (e: 'update:confirmText', value: string): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>Confirmar eliminación</h3>
          <button class="modal-close" :aria-label="$t('common.close')" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <p>
            ¿Estás seguro de eliminar la suscripción de
            <strong>{{ subscription?.email }}</strong
            >?
          </p>
          <div class="form-group delete-confirm-group">
            <label for="delete-confirm">Escribe <strong>Borrar</strong> para confirmar:</label>
            <input
              id="delete-confirm"
              type="text"
              placeholder="Borrar"
              autocomplete="off"
              :value="confirmText"
              @input="emit('update:confirmText', ($event.target as HTMLInputElement).value)"
            >
            <p v-if="confirmText && !canDelete" class="text-error">
              Escribe "Borrar" exactamente para continuar
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn-danger" :disabled="!canDelete" @click="emit('confirm')">
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
  padding: 1.25rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
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
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-gray-500);
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

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
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

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--color-gray-700);
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

.text-error {
  color: var(--color-error);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
