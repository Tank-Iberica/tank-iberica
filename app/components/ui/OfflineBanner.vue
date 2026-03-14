<script setup lang="ts">
/**
 * OfflineBanner — Shows a banner when the user is offline.
 * Disappears automatically when connectivity is restored.
 */
const { isOnline, pendingCount } = useOfflineSync()

const showBanner = computed(() => import.meta.client && !isOnline.value)
</script>

<template>
  <Transition name="offline-banner">
    <div v-if="showBanner" class="offline-banner" role="alert" aria-live="assertive">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span class="offline-text">{{ $t('common.offlineBanner') }}</span>
      <span v-if="pendingCount > 0" class="offline-pending">
        {{ $t('common.offlinePending', { count: pendingCount }) }}
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.offline-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-warning);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.offline-text {
  flex-shrink: 0;
}

.offline-pending {
  opacity: 0.85;
  font-weight: var(--font-weight-normal);
}

.offline-banner-enter-active {
  transition: transform 0.3s ease-out;
}

.offline-banner-leave-active {
  transition: transform 0.2s ease-in;
}

.offline-banner-enter-from,
.offline-banner-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .offline-banner-enter-active,
  .offline-banner-leave-active {
    transition: none;
  }
}
</style>
