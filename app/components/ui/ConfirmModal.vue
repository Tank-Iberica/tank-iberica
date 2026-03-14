<script setup lang="ts">
/**
 * Shared confirmation modal for destructive actions.
 *
 * Usage:
 *   <UiConfirmModal
 *     :show="showDelete"
 *     variant="danger"
 *     :title="$t('common.confirmDelete')"
 *     :message="$t('admin.users.deleteConfirm', { name: user.name })"
 *     :confirm-label="$t('common.delete')"
 *     :saving="deleting"
 *     require-type="borrar"
 *     @confirm="onDelete"
 *     @close="showDelete = false"
 *   />
 */

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    message?: string
    variant?: 'danger' | 'warning' | 'info'
    confirmLabel?: string
    cancelLabel?: string
    saving?: boolean
    /** When set, user must type this word to enable the confirm button */
    requireType?: string
  }>(),
  {
    message: '',
    variant: 'danger',
    confirmLabel: '',
    cancelLabel: '',
    saving: false,
    requireType: '',
  },
)

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const { t } = useI18n()

useScrollLock(toRef(props, 'show'))

const dialogRef = ref<HTMLElement | null>(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap()

const typedText = ref('')

const resolvedConfirmLabel = computed(() => props.confirmLabel || t('common.confirm'))
const resolvedCancelLabel = computed(() => props.cancelLabel || t('common.cancel'))

const isConfirmEnabled = computed(() => {
  if (props.saving) return false
  if (props.requireType) {
    return typedText.value.toLowerCase() === props.requireType.toLowerCase()
  }
  return true
})

// Reset typed text and manage focus trap when modal opens/closes
watch(
  () => props.show,
  (val) => {
    if (val) {
      typedText.value = ''
      nextTick(() => activateTrap(dialogRef.value))
    } else {
      deactivateTrap()
    }
  },
)

// Handle Escape via window (works regardless of which element has focus)
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-modal">
      <div
        v-if="show"
        class="confirm-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="emit('close')"
      >
        <div ref="dialogRef" class="confirm-dialog" :class="`confirm-dialog--${variant}`">
          <div class="confirm-header">
            <h3 class="confirm-title">{{ title }}</h3>
            <button class="confirm-close" :aria-label="$t('common.close')" @click="emit('close')">
              &#215;
            </button>
          </div>

          <div class="confirm-body">
            <p v-if="message" class="confirm-message">{{ message }}</p>
            <slot />

            <div v-if="requireType" class="confirm-type-group">
              <label for="confirm-type-input">
                {{ $t('common.typeToConfirm', { word: requireType }) }}
              </label>
              <input
                id="confirm-type-input"
                v-model="typedText"
                type="text"
                :placeholder="requireType"
                autocomplete="off"
              >
            </div>
          </div>

          <div class="confirm-footer">
            <button class="confirm-btn confirm-btn--secondary" @click="emit('close')">
              {{ resolvedCancelLabel }}
            </button>
            <button
              class="confirm-btn"
              :class="[
                variant === 'danger' ? 'confirm-btn--danger' : '',
                variant === 'warning' ? 'confirm-btn--warning' : '',
                variant === 'info' ? 'confirm-btn--info' : '',
              ]"
              :disabled="!isConfirmEnabled"
              @click="emit('confirm')"
            >
              <span v-if="saving" class="confirm-spinner" />
              {{ saving ? $t('common.processing') : resolvedConfirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 26rem;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
}

/* Header */
.confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.confirm-dialog--danger .confirm-header {
  background: var(--color-error-bg);
}

.confirm-dialog--danger .confirm-title {
  color: var(--color-error-text);
}

.confirm-dialog--warning .confirm-header {
  background: var(--color-warning-bg);
}

.confirm-dialog--warning .confirm-title {
  color: var(--color-warning-text);
}

.confirm-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.confirm-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-disabled);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.confirm-close:hover {
  color: var(--text-secondary);
}

.confirm-close:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 0.125rem;
}

/* Body */
.confirm-body {
  padding: var(--spacing-6);
  overflow-y: auto;
  flex: 1;
}

.confirm-message {
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

/* Type-to-confirm input */
.confirm-type-group {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
}

.confirm-type-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.confirm-type-group input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-family: inherit;
  min-height: 2.75rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.confirm-type-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* Footer */
.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  flex-shrink: 0;
}

/* Buttons */
.confirm-btn {
  padding: var(--spacing-3) var(--spacing-5);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 2.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s ease;
}

.confirm-btn--secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.confirm-btn--secondary:hover {
  background: var(--bg-tertiary);
}

.confirm-btn--danger {
  background: var(--color-error);
  color: var(--color-white);
}

.confirm-btn--danger:hover:not(:disabled) {
  background: var(--color-red-600);
}

.confirm-btn--warning {
  background: var(--color-warning);
  color: var(--color-white);
}

.confirm-btn--warning:hover:not(:disabled) {
  background: var(--color-amber-600);
}

.confirm-btn--info {
  background: var(--color-info);
  color: var(--color-white);
}

.confirm-btn--info:hover:not(:disabled) {
  background: var(--color-focus);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-btn:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 0.125rem;
}

/* Spinner */
.confirm-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: confirm-spin 0.6s linear infinite;
}

@keyframes confirm-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transition */
.confirm-modal-enter-active {
  transition: opacity 0.2s ease;
}

.confirm-modal-enter-active .confirm-dialog {
  animation: confirm-dialog-in 0.2s ease-out;
}

.confirm-modal-leave-active {
  transition: opacity 0.15s ease;
}

.confirm-modal-enter-from,
.confirm-modal-leave-to {
  opacity: 0;
}

@keyframes confirm-dialog-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .confirm-modal-enter-active,
  .confirm-modal-leave-active {
    transition: none;
  }

  .confirm-modal-enter-active .confirm-dialog {
    animation: none;
  }
}
</style>
