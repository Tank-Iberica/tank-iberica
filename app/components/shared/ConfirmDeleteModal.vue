<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    itemLabel?: string
    requireConfirmation?: boolean
    confirmWord?: string
    loading?: boolean
    warningText?: string
  }>(),
  {
    itemLabel: '',
    requireConfirmation: false,
    confirmWord: 'borrar',
    loading: false,
    warningText: '',
  },
)

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
}>()

const { t } = useI18n()

const confirmInput = ref('')

const canConfirm = computed(() => {
  if (!props.requireConfirmation) return true
  return confirmInput.value.toLowerCase() === props.confirmWord.toLowerCase()
})

function close() {
  confirmInput.value = ''
  emit('update:show', false)
}

function handleConfirm() {
  if (!canConfirm.value || props.loading) return
  emit('confirm')
}

watch(
  () => props.show,
  (val) => {
    if (!val) confirmInput.value = ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button class="modal-close" :aria-label="t('common.close')" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <p v-if="itemLabel" class="modal-item-label">
              {{ itemLabel }}
            </p>
            <p class="modal-warning-text">
              {{ warningText || t('shared.deleteModal.irreversible') }}
            </p>
            <div v-if="requireConfirmation" class="form-group">
              <label class="form-label">
                {{ t('shared.deleteModal.typeToConfirm', { word: confirmWord }) }}
              </label>
              <input
                v-model="confirmInput"
                type="text"
                class="form-input"
                :placeholder="confirmWord"
                autocomplete="off"
                @keyup.enter="handleConfirm"
              >
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="close">
              {{ t('common.cancel') }}
            </button>
            <button class="btn-danger" :disabled="!canConfirm || loading" @click="handleConfirm">
              {{ loading ? t('common.loading') : t('common.delete') }}
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
  z-index: 1000;
  padding: 16px;
}

@media (min-width: 480px) {
  .modal-overlay {
    align-items: center;
  }
}

.modal-container {
  background: #fff;
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
}

@media (min-width: 480px) {
  .modal-container {
    border-radius: 12px;
  }
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
  font-size: 1rem;
  font-weight: 600;
  color: #dc2626;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 20px;
}

.modal-item-label {
  font-weight: 600;
  margin: 0 0 8px;
  color: #111827;
}

.modal-warning-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 16px;
}

.form-group {
  margin-top: 12px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  padding: 8px 16px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: translateY(20px);
}

.modal-leave-to .modal-container {
  transform: translateY(20px);
}
</style>
