<script setup lang="ts">
import type { Comment } from '~/composables/admin/useAdminComentarios'

defineProps<{
  show: boolean
  comment: Comment | null
  actionLoading: string | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>{{ $t('admin.comments.deleteTitle') }}</h3>
          <button class="modal-close" @click="emit('cancel')">x</button>
        </div>
        <div class="modal-body">
          <p>
            {{ $t('admin.comments.deleteConfirm', { author: comment?.author_name || $t('admin.comments.anonymous') }) }}
          </p>
          <div v-if="comment" class="delete-preview">
            {{
              comment.content.length > 120
                ? comment.content.substring(0, 120) + '...'
                : comment.content
            }}
          </div>
          <p class="text-warning">
            {{ $t('admin.comments.deleteWarning') }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('cancel')">{{ $t('common.cancel') }}</button>
          <button
            class="btn-danger"
            :disabled="actionLoading === comment?.id"
            @click="emit('confirm')"
          >
            {{ actionLoading === comment?.id ? $t('common.deleting') : $t('common.delete') }}
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
  max-width: 26.25rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-gray-900);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: var(--spacing-1) var(--spacing-2);
  line-height: 1;
  font-weight: 600;
}

.modal-close:hover {
  color: var(--color-gray-700);
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-body p {
  margin: 0 0 var(--spacing-3) 0;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  line-height: 1.5;
}

.delete-preview {
  background: var(--color-gray-50);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-3);
  font-size: 0.85rem;
  color: var(--color-gray-500);
  line-height: 1.5;
  margin-bottom: var(--spacing-3);
  font-style: italic;
}

.text-warning {
  color: var(--color-warning);
  font-size: 0.8rem;
  background: var(--color-amber-50);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius);
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 12px 12px;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  min-height: 2.75rem;
}

.btn-secondary:hover {
  background: var(--color-gray-300);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  min-height: 2.75rem;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
