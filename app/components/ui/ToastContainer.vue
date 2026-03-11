<script setup lang="ts">
const { toasts, remove } = useToast()

const iconMap: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<template>
  <Teleport to="body">
    <div v-if="toasts.length" class="toast-container" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <span class="toast__icon" aria-hidden="true">{{ iconMap[toast.type] }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            class="toast__close"
            :aria-label="$t('common.close', 'Cerrar')"
            @click="remove(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-4);
  right: var(--spacing-4);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-width: 24rem;
  width: calc(100% - 2rem);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  pointer-events: auto;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.toast--success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border-left: 4px solid var(--color-success);
}

.toast--error {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border-left: 4px solid var(--color-error);
}

.toast--warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border-left: 4px solid var(--color-warning);
}

.toast--info {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border-left: 4px solid var(--color-info);
}

.toast__icon {
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
}

.toast__message {
  flex: 1;
}

.toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  padding: var(--spacing-1);
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.toast__close:hover {
  opacity: 1;
}

/* Transitions */
.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(2rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(2rem);
}

.toast-move {
  transition: transform 0.3s ease;
}

@media (max-width: 30em) {
  .toast-container {
    top: auto;
    bottom: var(--spacing-4);
    right: var(--spacing-2);
    left: var(--spacing-2);
    width: auto;
    max-width: none;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(2rem);
  }
}
</style>
