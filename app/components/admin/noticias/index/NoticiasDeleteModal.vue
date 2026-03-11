<script setup lang="ts">
import type { DeleteTarget } from '~/composables/admin/useAdminNoticiasIndex'

defineProps<{
  visible: boolean
  target: DeleteTarget | null
  confirmText: string
}>()

const emit = defineEmits<{
  (e: 'update:confirmText', value: string): void
  (e: 'close' | 'confirm'): void
}>()

function onConfirmInput(event: Event) {
  const input = event.target as HTMLInputElement
  emit('update:confirmText', input.value)
}

function onKeydownEnter() {
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="modal-content">
        <h3>{{ $t('admin.news.deleteTitle') }}</h3>
        <p>{{ $t('admin.news.aboutToDelete') }}</p>
        <p class="delete-title">{{ target?.title_es }}</p>
        <p class="delete-warning" v-html="$t('admin.news.deleteWarning', { word: '<strong>borrar</strong>' })" />
        <input
          :value="confirmText"
          type="text"
          :placeholder="$t('admin.news.typeBorrar')"
          class="confirm-input"
          @input="onConfirmInput"
          @keydown.enter="onKeydownEnter"
        >
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
  padding: var(--spacing-4);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  max-width: 26.25rem;
  width: 100%;
}

.modal-content h3 {
  margin: 0 0 var(--spacing-3);
  font-size: 1.1rem;
  color: var(--color-near-black);
}

.modal-content p {
  margin: 0 0 var(--spacing-2);
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.delete-title {
  font-weight: 600;
  color: var(--color-near-black) !important;
}

.delete-warning {
  margin-top: var(--spacing-3) !important;
  color: var(--color-error) !important;
  font-size: 0.85rem !important;
}

.confirm-input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  margin: 0.75rem 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-top: var(--spacing-4);
}

.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--color-gray-700);
  transition: all 0.15s;
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
