<template>
  <div class="offline-page">
    <div class="offline-card">
      <div class="offline-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
          <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0122.56 9" />
          <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
          <path d="M8.53 16.11a6 6 0 016.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 class="offline-title">{{ $t('offline.title') }}</h1>
      <p class="offline-message">{{ $t('offline.message') }}</p>
      <button class="btn-retry" type="button" @click="retry">
        {{ $t('offline.retry') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()

useHead({
  title: t('offline.title'),
})

const retry = (): void => {
  window.location.reload()
}
</script>

<style scoped>
.offline-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--header-height) - 80px);
  padding: var(--spacing-6) var(--spacing-4);
}

.offline-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-4);
  background: var(--bg-primary);
  width: 100%;
  max-width: 400px;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-10) var(--spacing-6);
  box-shadow: var(--shadow-md);
}

.offline-icon {
  color: var(--text-auxiliary);
}

.offline-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.offline-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 320px;
}

.btn-retry {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  min-height: 48px;
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-primary-light);
}
</style>
