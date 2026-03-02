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
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
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
  padding: 16px;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  line-height: 1;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.preview-container {
  background: #f9fafb;
  padding: 24px;
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

/* -- Buttons -- */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 44px;
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
  color: #374151;
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  transition: all 0.2s;
  min-height: 40px;
}

.btn-secondary:hover {
  background: #f9fafb;
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
