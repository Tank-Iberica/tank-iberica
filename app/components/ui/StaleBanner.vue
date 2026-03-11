<script setup lang="ts">
/**
 * StaleBanner — Shows a warning when displayed data may not be up to date.
 * Used with useStaleFallback composable.
 */
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
</script>

<template>
  <Transition name="stale-banner">
    <div v-if="visible" class="stale-banner" role="alert">
      <span class="stale-banner__text">
        {{ t('common.staleDataWarning') }}
      </span>
      <button type="button" class="stale-banner__retry" @click="emit('retry')">
        {{ t('common.retry') }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.stale-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-warning-light, #fef3c7);
  color: var(--color-warning-dark, #92400e);
  font-size: var(--font-size-xs);
  text-align: center;
  flex-wrap: wrap;
}

.stale-banner__retry {
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: none;
  border: 1px solid currentColor;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-1) var(--spacing-3);
  cursor: pointer;
  color: inherit;
  min-height: 2.75rem;
}

.stale-banner-enter-active,
.stale-banner-leave-active {
  transition:
    opacity 0.2s ease,
    max-height 0.2s ease;
}

.stale-banner-enter-from,
.stale-banner-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
