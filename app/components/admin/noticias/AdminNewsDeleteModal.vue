<script setup lang="ts">
defineProps<{
  visible: boolean
  articleTitle: string | undefined
  confirmText: string
}>()

defineEmits<{
  close: []
  confirm: []
  'update:confirmText': [value: string]
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <h3>Eliminar noticia</h3>
        <p>Estas a punto de eliminar:</p>
        <p class="delete-title">{{ articleTitle }}</p>
        <p class="delete-warning">
          Esta accion no se puede deshacer. Escribe <strong>borrar</strong> para confirmar.
        </p>
        <input
          type="text"
          placeholder="Escribe 'borrar'"
          class="confirm-input"
          :value="confirmText"
          @input="$emit('update:confirmText', ($event.target as HTMLInputElement).value)"
          @keydown.enter="$emit('confirm')"
        >
        <div class="modal-actions">
          <button class="btn" @click="$emit('close')">Cancelar</button>
          <button
            class="btn btn-danger"
            :disabled="confirmText !== 'borrar'"
            @click="$emit('confirm')"
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
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
}

.modal-content h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.modal-content p {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 0.9rem;
}

.delete-title {
  font-weight: 600;
  color: #1a1a1a !important;
}

.delete-warning {
  margin-top: 12px !important;
  color: #dc2626 !important;
  font-size: 0.85rem !important;
}

.confirm-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin: 12px 0;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: white;
  color: #374151;
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn:hover {
  background: #f8fafc;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
