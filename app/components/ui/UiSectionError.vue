<template>
  <NuxtErrorBoundary @error="handleError">
    <slot />
    <template #error="{ error, clearError }">
      <div class="section-error" role="alert">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="section-error-text">{{ message || $t('error.sectionFailed', 'No se pudo cargar esta sección') }}</p>
        <button class="section-error-retry" @click="clearError">
          {{ $t('common.retry', 'Reintentar') }}
        </button>
      </div>
    </template>
  </NuxtErrorBoundary>
</template>

<script setup lang="ts">
const props = defineProps<{
  section?: string
  message?: string
}>()

function handleError(error: unknown) {
  console.error(`[${props.section || 'section'}] Error boundary caught:`, error)
}
</script>

<style scoped>
.section-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: var(--spacing-6) var(--spacing-4);
  text-align: center;
  color: var(--text-auxiliary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
}

.section-error svg {
  color: var(--color-warning);
}

.section-error-text {
  font-size: var(--font-size-sm);
  margin: 0;
}

.section-error-retry {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-primary);
  min-height: 2.25rem;
  transition: background var(--transition-fast);
}

.section-error-retry:hover {
  background: var(--color-primary);
  color: var(--color-white);
}
</style>
