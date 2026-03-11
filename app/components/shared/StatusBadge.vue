<script setup lang="ts">
import { getStatusConfig } from '~/composables/shared/useListingUtils'

const props = withDefaults(
  defineProps<{
    status: string
    size?: 'sm' | 'md'
    variant?: 'pill' | 'badge'
  }>(),
  { size: 'sm', variant: 'pill' },
)

const { t } = useI18n()

const config = computed(() => getStatusConfig(props.status))
</script>

<template>
  <span
    class="status-badge"
    :class="[config.cssClass, `status-badge--${size}`, `status-badge--${variant}`]"
  >
    {{ t(config.label) }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1;
}

/* Sizes */
.status-badge--sm {
  font-size: 0.7rem;
  padding: 0.1875rem 0.5rem;
}
.status-badge--md {
  font-size: var(--font-size-xs);
  padding: 0.25rem 0.625rem;
}

/* Variants */
.status-badge--pill {
  border-radius: var(--border-radius-full);
}
.status-badge--badge {
  border-radius: var(--border-radius-sm);
}

/* Status colors */
.status--published {
  color: var(--color-success-text);
  background: var(--color-success-bg);
}
.status--draft {
  color: var(--text-secondary);
  background: var(--color-gray-100);
}
.status--paused {
  color: var(--color-warning-text);
  background: var(--color-warning-bg);
}
.status--rented {
  color: var(--color-info-text);
  background: var(--color-info-bg);
}
.status--workshop,
.status--maintenance {
  color: var(--color-orange-text);
  background: var(--color-orange-bg);
}
.status--sold {
  color: var(--color-purple-text);
  background: var(--color-purple-bg);
}
</style>
