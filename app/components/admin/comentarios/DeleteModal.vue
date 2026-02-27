<script setup lang="ts">
import type { Comment } from '~/composables/admin/useAdminComentarios'

defineProps<{
  show: boolean
  comment: Comment | null
  actionLoading: string | null
}>()

const emit = defineEmits<{
  (e: 'confirm' | 'cancel'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>Eliminar comentario</h3>
          <button class="modal-close" @click="emit('cancel')">x</button>
        </div>
        <div class="modal-body">
          <p>
            Estas seguro de eliminar este comentario de
            <strong>{{ comment?.author_name || 'Anonimo' }}</strong
            >?
          </p>
          <div v-if="comment" class="delete-preview">
            {{
              comment.content.length > 120
                ? comment.content.substring(0, 120) + '...'
                : comment.content
            }}
          </div>
          <p class="text-warning">
            Esta accion no se puede deshacer. Si el comentario tiene respuestas, tambien seran
            eliminadas.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('cancel')">Cancelar</button>
          <button
            class="btn-danger"
            :disabled="actionLoading === comment?.id"
            @click="emit('confirm')"
          >
            {{ actionLoading === comment?.id ? 'Eliminando...' : 'Eliminar' }}
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
  max-width: 420px;
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
  font-size: 1.1rem;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  line-height: 1;
  font-weight: 600;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.5;
}

.delete-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 12px;
  font-style: italic;
}

.text-warning {
  color: #d97706;
  font-size: 0.8rem;
  background: #fffbeb;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  min-height: 44px;
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
  font-size: 0.85rem;
  min-height: 44px;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
