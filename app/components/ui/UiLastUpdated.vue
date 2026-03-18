<template>
  <span class="last-updated" :title="fullDate">
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  timestamp: Date | string | number | null
}>()

const { t } = useI18n()

const date = computed(() => {
  if (!props.timestamp) return null
  const d = props.timestamp instanceof Date ? props.timestamp : new Date(props.timestamp)
  return Number.isNaN(d.getTime()) ? null : d
})

const label = computed(() => {
  if (!date.value) return t('common.noData', 'Sin datos')
  const now = new Date()
  const diffMs = now.getTime() - date.value.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return t('common.justNow', 'Ahora mismo')
  if (diffMin < 60) return t('common.minutesAgo', { n: diffMin })

  // Today → show time
  if (date.value.toDateString() === now.toDateString()) {
    return date.value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  // Yesterday or older → show date
  return date.value.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
})

const fullDate = computed(() => date.value?.toLocaleString() ?? '')
</script>

<style scoped>
.last-updated {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  white-space: nowrap;
}
</style>
