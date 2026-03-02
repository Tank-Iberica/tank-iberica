<script setup lang="ts">
defineProps<{
  show: boolean
  actionLoading: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
        <div class="modal-panel">
          <div class="modal-header">
            <h2>{{ t('admin.whatsapp.confirmDeleteTitle') }}</h2>
            <button class="modal-close" @click="emit('cancel')">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>{{ t('admin.whatsapp.confirmDeleteText') }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-confirm-delete" :disabled="actionLoading" @click="emit('confirm')">
              {{ t('common.delete') }}
            </button>
            <button class="btn-cancel" @click="emit('cancel')">
              {{ t('common.cancel') }}
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
  align-items: flex-end;
  justify-content: center;
  z-index: 9000;
  padding: 0;
}

.modal-panel {
  background: var(--bg-primary);
  width: 100%;
  max-height: 90vh;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-gray-100);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-auxiliary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-body p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-gray-100);
}

.btn-confirm-delete,
.btn-cancel {
  flex: 1;
  min-width: 100px;
  min-height: 44px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.btn-confirm-delete {
  background: var(--color-error);
  color: white;
}

.btn-confirm-delete:hover {
  background: var(--color-error);
}

.btn-confirm-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  transform: translateY(100%);
}

.modal-leave-to .modal-panel {
  transform: translateY(100%);
}

/* 768px+ : Modal centered */
@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    padding: 20px;
  }

  .modal-panel {
    border-radius: 16px;
    max-width: 480px;
  }
}
</style>
