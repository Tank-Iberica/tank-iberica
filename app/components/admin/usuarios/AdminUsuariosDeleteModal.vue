<script setup lang="ts">
import type { AdminUser } from '~/composables/admin/useAdminUsuariosPage'

const props = defineProps<{
  show: boolean
  user: AdminUser | null
}>()

const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
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
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>Confirmar eliminación</h3>
          <button class="modal-close" @click="emit('close')">×</button>
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
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
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
  position: sticky;
  top: 0;
  background: white;
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
  position: sticky;
  bottom: 0;
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

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-warning {
  color: #d97706;
  font-size: 0.85rem;
  background: #fffbeb;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
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

.text-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
}
</style>
