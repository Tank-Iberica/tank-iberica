<script setup lang="ts">
const props = defineProps<{
  open: boolean
  loading: boolean
  apiError: string | null
}>()

const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
}>()

const { t } = useI18n()

const confirmText = ref('')
const localError = ref<string | null>(null)

function handleConfirm() {
  if (confirmText.value !== 'ELIMINAR') {
    localError.value = t('gdpr.deleteConfirmError')
    return
  }
  localError.value = null
  emit('confirm')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      confirmText.value = ''
      localError.value = null
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="delete-modal-overlay" @click.self="emit('close')">
        <div class="delete-modal" role="dialog" :aria-label="t('gdpr.deleteAccountTitle')">
          <h3 class="delete-modal__title">{{ t('gdpr.deleteAccountTitle') }}</h3>
          <p class="delete-modal__warning">{{ t('gdpr.deleteAccountWarning') }}</p>
          <p class="delete-modal__instruction">{{ t('gdpr.deleteConfirmInstruction') }}</p>

          <input
            v-model="confirmText"
            type="text"
            class="delete-modal__input"
            placeholder="ELIMINAR"
            autocomplete="off"
          />

          <div v-if="localError || apiError" class="delete-modal__error">
            {{ localError || apiError }}
          </div>

          <div class="delete-modal__actions">
            <button class="delete-modal__btn delete-modal__btn--cancel" @click="emit('close')">
              {{ t('common.cancel') }}
            </button>
            <button
              class="delete-modal__btn delete-modal__btn--confirm"
              :disabled="loading"
              @click="handleConfirm"
            >
              {{ loading ? t('common.loading') : t('gdpr.confirmDelete') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.delete-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 16px;
}

.delete-modal {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.delete-modal__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-error);
  margin: 0 0 12px 0;
}

.delete-modal__warning {
  font-size: 0.9rem;
  color: #333;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.delete-modal__instruction {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 12px 0;
}

.delete-modal__input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 44px;
}

.delete-modal__input:focus {
  outline: none;
  border-color: var(--color-error);
}

.delete-modal__error {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-radius: 6px;
  font-size: 0.85rem;
}

.delete-modal__actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.delete-modal__btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  border: none;
  font-size: 0.9rem;
}

.delete-modal__btn--cancel {
  background: #f0f0f0;
  color: #333;
}

.delete-modal__btn--cancel:hover {
  background: #e0e0e0;
}

.delete-modal__btn--confirm {
  background: var(--color-error);
  color: white;
}

.delete-modal__btn--confirm:hover:not(:disabled) {
  background: var(--color-error);
}

.delete-modal__btn--confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
