<script setup lang="ts">
import type { AdminUser } from '~/composables/admin/useAdminUsuariosPage'

const props = defineProps<{
  show: boolean
  user: AdminUser | null
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const confirmText = ref('')

const canDelete = computed(() => confirmText.value.toLowerCase() === 'borrar')

// Reset confirmText when modal opens
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      confirmText.value = ''
    }
  },
)
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
            ¿Estás seguro de eliminar al usuario
            <strong>{{ user?.pseudonimo || user?.email }}</strong
            >?
          </p>
          <p class="text-warning">Esta acción eliminará la cuenta y todos sus datos asociados.</p>
          <div class="form-group delete-confirm-group">
            <label for="delete-confirm">Escribe <strong>Borrar</strong> para confirmar:</label>
            <input
              id="delete-confirm"
              v-model="confirmText"
              type="text"
              placeholder="Borrar"
              autocomplete="off"
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
  padding: var(--spacing-5);
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
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
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
  padding: var(--spacing-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  position: sticky;
  bottom: 0;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-warning {
  color: var(--color-warning);
  font-size: 0.85rem;
  background: var(--color-amber-50);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius);
  margin-top: var(--spacing-2);
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

.delete-confirm-group {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-gray-200);
}

.delete-confirm-group input {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
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
  margin-top: var(--spacing-1);
}
</style>
