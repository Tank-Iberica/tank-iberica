<script setup lang="ts">
/**
 * OperationBanner — Sticky banner for long-running operations (>2s).
 * Shows after a delay to avoid flash for quick operations.
 * Disappears automatically when the operation completes.
 *
 * Usage:
 * <UiOperationBanner :active="isSaving" :message="$t('common.saving')" />
 */
const props = withDefaults(
  defineProps<{
    /** Whether the operation is active */
    active: boolean
    /** Message to display */
    message?: string
    /** Delay before showing (ms) */
    delay?: number
  }>(),
  {
    message: '',
    delay: 2000,
  },
)

const { t } = useI18n()

const showBanner = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      timer = setTimeout(() => {
        showBanner.value = true
      }, props.delay)
    } else {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      showBanner.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="op-banner">
    <div v-if="showBanner" class="op-banner" role="status" aria-live="polite">
      <span class="op-banner__spinner" aria-hidden="true" />
      <span class="op-banner__text">{{ message || t('common.operationInProgress') }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.op-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--color-primary);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.op-banner__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: op-spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes op-spin {
  to { transform: rotate(360deg); }
}

.op-banner-enter-active {
  transition: transform 0.3s ease-out;
}

.op-banner-leave-active {
  transition: transform 0.2s ease-in;
}

.op-banner-enter-from,
.op-banner-leave-to {
  transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .op-banner-enter-active,
  .op-banner-leave-active {
    transition: none;
  }
}
</style>
