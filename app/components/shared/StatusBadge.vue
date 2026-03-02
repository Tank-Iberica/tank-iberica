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
  padding: 3px 8px;
}
.status-badge--md {
  font-size: 0.75rem;
  padding: 4px 10px;
}

/* Variants */
.status-badge--pill {
  border-radius: 9999px;
}
.status-badge--badge {
  border-radius: 4px;
}

/* Status colors */
.status--published {
  color: #15803d;
  background: rgba(21, 128, 61, 0.1);
}
.status--draft {
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
}
.status--paused {
  color: #b45309;
  background: rgba(180, 83, 9, 0.1);
}
.status--rented {
  color: var(--color-info);
  background: rgba(29, 78, 216, 0.1);
}
.status--workshop,
.status--maintenance {
  color: #c2410c;
  background: rgba(194, 65, 12, 0.1);
}
.status--sold {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}
</style>
