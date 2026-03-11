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
    <div v-if="visible" class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="modal-content">
        <h3>{{ $t('admin.news.deleteTitle') }}</h3>
        <p>{{ $t('admin.news.aboutToDelete') }}</p>
        <p class="delete-title">{{ articleTitle }}</p>
        <p class="delete-warning" v-html="$t('admin.news.deleteWarning', { word: '<strong>borrar</strong>' })" />
        <input
          type="text"
          :placeholder="$t('admin.news.typeBorrar')"
          class="confirm-input"
          :value="confirmText"
          @input="$emit('update:confirmText', ($event.target as HTMLInputElement).value)"
          @keydown.enter="$emit('confirm')"
        />
        <div class="modal-actions">
          <button class="btn" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button
            class="btn btn-danger"
            :disabled="confirmText !== 'borrar'"
            @click="$emit('confirm')"
          >
            {{ $t('common.delete') }}
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
  padding: 1rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  max-width: 26.25rem;
  width: 100%;
}

.modal-content h3 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  color: var(--color-near-black);
}

.modal-content p {
  margin: 0 0 0.5rem;
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.delete-title {
  font-weight: 600;
  color: var(--color-near-black) !important;
}

.delete-warning {
  margin-top: 0.75rem !important;
  color: var(--color-error) !important;
  font-size: 0.85rem !important;
}

.confirm-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-sm);
  margin: 0.75rem 0;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--color-gray-700);
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border-color: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
