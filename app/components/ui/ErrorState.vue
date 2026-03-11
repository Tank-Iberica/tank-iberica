<template>
  <div :class="['error-state', `error-state--${variant}`]" role="alert" aria-live="assertive">
    <div class="error-state__icon" aria-hidden="true">
      <svg v-if="type === 'network'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <circle cx="12" cy="20" r="1" fill="currentColor" />
      </svg>
      <svg v-else-if="type === 'permission'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <svg v-else-if="type === 'notfound'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <svg v-else-if="type === 'validation'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <!-- default: generic error -->
      <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>

    <h2 class="error-state__title">{{ title }}</h2>
    <p v-if="description" class="error-state__description">{{ description }}</p>
    <p v-if="hint" class="error-state__hint">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {{ hint }}
    </p>

    <div v-if="$slots.actions" class="error-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  hint?: string
  type?: 'generic' | 'network' | 'permission' | 'notfound' | 'validation'
  variant?: 'default' | 'inline' | 'card'
}>(), {
  type: 'generic',
  variant: 'default',
})
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  gap: var(--spacing-3);
}

.error-state--inline {
  padding: var(--spacing-4);
  flex-direction: row;
  text-align: left;
  align-items: flex-start;
  gap: var(--spacing-3);
  background: var(--bg-error-subtle, #fef2f2);
  border: 1px solid var(--border-error-light, #fecaca);
  border-radius: var(--radius-md);
}

.error-state--inline .error-state__icon {
  flex-shrink: 0;
}

.error-state--inline .error-state__title {
  font-size: var(--font-size-base);
}

.error-state--card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-8);
}

.error-state__icon {
  color: var(--color-error, #dc2626);
  opacity: 0.85;
}

.error-state--inline .error-state__icon {
  color: var(--color-error, #dc2626);
  opacity: 0.7;
}

.error-state__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.error-state__description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  max-width: 42ch;
}

.error-state--inline .error-state__description {
  max-width: none;
}

.error-state__hint {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-tertiary, var(--text-secondary));
  background: var(--bg-tertiary, var(--bg-secondary));
  border-radius: var(--radius-sm);
  padding: var(--spacing-2) var(--spacing-3);
  margin: 0;
}

.error-state__hint svg {
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: var(--color-primary);
}

.error-state__actions {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--spacing-2);
}

.error-state--inline .error-state__actions {
  justify-content: flex-start;
}
</style>
