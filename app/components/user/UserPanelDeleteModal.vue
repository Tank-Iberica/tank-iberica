<script setup lang="ts">
const props = defineProps<{
  open: boolean
  loading: boolean
  apiError: string | null
}>()

const emit = defineEmits<{
  close: []
  confirm: []
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
          >

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
  padding: 1rem;
}

.delete-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  max-width: 26.25rem;
  width: 100%;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.delete-modal__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-error);
  margin: 0 0 0.75rem 0;
}

.delete-modal__warning {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
}

.delete-modal__instruction {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem 0;
}

.delete-modal__input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 0.125rem solid #ddd;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  min-height: 2.75rem;
}

.delete-modal__input:focus {
  outline: none;
  border-color: var(--color-error);
}

.delete-modal__error {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
}

.delete-modal__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.delete-modal__btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
  border: none;
  font-size: 0.9rem;
}

.delete-modal__btn--cancel {
  background: var(--color-skeleton-bg);
  color: var(--text-primary);
}

.delete-modal__btn--cancel:hover {
  background: var(--color-skeleton-shine);
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
