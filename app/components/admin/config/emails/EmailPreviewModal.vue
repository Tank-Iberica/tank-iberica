<script setup lang="ts">
defineProps<{
  show: boolean
  previewHtml: string
  sendingTest: boolean
  testSent: boolean
}>()

const emit = defineEmits<{
  close: []
  'send-test': []
}>()

const { sanitize } = useSanitize()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ $t('admin.emails.previewTitle') }}</h3>
            <button class="modal-close" @click="emit('close')">&times;</button>
          </div>
          <div class="modal-body">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="preview-container" v-html="sanitize(previewHtml)" />
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="emit('close')">
              {{ $t('admin.emails.close') }}
            </button>
            <button class="btn-primary" :disabled="sendingTest" @click="emit('send-test')">
              {{ sendingTest ? $t('admin.emails.sending') : $t('admin.emails.sendTest') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
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
  width: 100%;
  max-width: 42.5rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-gray-800);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: var(--spacing-1) var(--spacing-2);
  line-height: 1;
  min-height: 2.75rem;
  min-width: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--color-gray-800);
}

.modal-body {
  padding: var(--spacing-5);
  overflow-y: auto;
  flex: 1;
}

.preview-container {
  background: var(--color-gray-50);
  padding: var(--spacing-6);
  border-radius: var(--border-radius);
}

.modal-footer {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--color-gray-200);
}

/* -- Buttons -- */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 2.75rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--color-gray-700);
  border: 1px solid var(--border-color);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  transition: all 0.2s;
  min-height: 2.5rem;
}

.btn-secondary:hover {
  background: var(--color-gray-50);
  border-color: var(--text-disabled);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* -- Transitions -- */
.modal-enter-active {
  transition: opacity 0.2s;
}

.modal-enter-active .modal-content {
  transition: transform 0.2s;
}

.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-leave-active .modal-content {
  transition: transform 0.2s;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-content {
  transform: scale(0.95);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
