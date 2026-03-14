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

useScrollLock(toRef(props, 'show'))

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

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => globalThis.addEventListener('keydown', onKeydown))
onUnmounted(() => globalThis.removeEventListener('keydown', onKeydown))
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
  padding: 1rem;
}

@media (min-width: 30em) {
  .modal-overlay {
    align-items: center;
  }
}

.modal-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
  width: 100%;
  max-width: 27.5rem;
  max-height: 90vh;
  overflow-y: auto;
}

@media (min-width: 30em) {
  .modal-container {
    border-radius: var(--border-radius-md);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-error);
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: 0.25rem;
  border-radius: var(--border-radius-sm);
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1.25rem;
}

.modal-item-label {
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-gray-900);
}

.modal-warning-text {
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  margin: 0 0 1rem;
}

.form-group {
  margin-top: 0.75rem;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary, var(--color-primary));
  box-shadow: var(--shadow-ring-strong);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  color: var(--color-gray-700);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-danger {
  padding: 0.5rem 1rem;
  background: var(--color-error);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
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
  transform: translateY(1.25rem);
}

.modal-leave-to .modal-container {
  transform: translateY(1.25rem);
}

/* Landscape on short viewports: ensure modal stays visible */
@media (orientation: landscape) and (max-height: 30em) {
  .modal-overlay {
    align-items: center;
  }

  .modal-container {
    border-radius: var(--border-radius-md);
    max-height: 90dvh;
  }
}
</style>
