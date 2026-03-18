<template>
  <div class="stat-card" :class="{ 'stat-card--clickable': !!to || $attrs.onClick }">
    <component :is="to ? 'NuxtLink' : 'div'" :to="to" class="stat-card-inner">
      <div v-if="icon || $slots.icon" class="stat-card-icon" aria-hidden="true">
        <slot name="icon">
          <span v-if="icon">{{ icon }}</span>
        </slot>
      </div>
      <div class="stat-card-content">
        <span class="stat-card-value">{{ value }}</span>
        <span class="stat-card-label">{{ label }}</span>
      </div>
      <span v-if="trend !== undefined" :class="['stat-card-trend', trendClass]">
        {{ trendLabel }}
      </span>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string | number
  label: string
  icon?: string
  trend?: number
  to?: string
}>()

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  if (props.trend > 0) return 'stat-card-trend--up'
  if (props.trend < 0) return 'stat-card-trend--down'
  return 'stat-card-trend--neutral'
})

const trendLabel = computed(() => {
  if (props.trend === undefined) return ''
  const sign = props.trend > 0 ? '+' : ''
  return `${sign}${props.trend}%`
})
</script>

<style scoped>
.stat-card {
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.stat-card--clickable {
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}

.stat-card--clickable:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-card-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: var(--spacing-4);
  text-decoration: none;
  color: inherit;
}

.stat-card-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.stat-card-value {
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-card-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-card-trend {
  font-size: var(--font-size-sm);
  font-weight: 600;
  flex-shrink: 0;
}

.stat-card-trend--up {
  color: var(--color-success);
}

.stat-card-trend--down {
  color: var(--color-error);
}

.stat-card-trend--neutral {
  color: var(--text-auxiliary);
}
</style>
