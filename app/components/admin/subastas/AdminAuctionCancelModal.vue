<script setup lang="ts">
defineProps<{
  show: boolean
  reason: string
}>()

const emit = defineEmits<{
  'update:reason': [value: string]
  confirm: []
  close: []
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header danger">
          <h3>{{ t('admin.subastas.cancelTitle') }}</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ t('admin.subastas.cancelConfirm') }}</p>
          <p class="text-danger">{{ t('admin.subastas.cancelWarning') }}</p>
          <div class="form-group">
            <label>{{ t('admin.subastas.cancelReason') }}</label>
            <textarea
              :value="reason"
              rows="2"
              :placeholder="t('admin.subastas.cancelReasonPlaceholder')"
              @input="emit('update:reason', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">
            {{ t('admin.subastas.form.cancel') }}
          </button>
          <button class="btn-danger" @click="emit('confirm')">
            {{ t('admin.subastas.confirmCancel') }}
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
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: var(--spacing-5);
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.2s ease-out;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  margin: 0.625rem;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-sm {
  max-width: 26.25rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  flex-shrink: 0;
}

.modal-header.danger {
  background: var(--color-error-bg, var(--color-error-bg));
  border-color: var(--color-error-border);
}

.modal-header.danger h3 {
  color: var(--color-error);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--text-disabled);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--text-secondary);
}

.modal-body {
  padding: var(--spacing-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--bg-secondary);
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
}

.text-danger {
  color: var(--color-error);
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  min-height: 5rem;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-danger:hover {
  background: var(--color-error);
}

@media (min-width: 48em) {
  .modal {
    margin: 0;
  }
}
</style>
