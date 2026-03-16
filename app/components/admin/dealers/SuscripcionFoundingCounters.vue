<script setup lang="ts">
/**
 * SuscripcionFoundingCounters — Founding plan counter cards per vertical
 * Extracted from pages/admin/dealers/suscripciones.vue
 */

const { t } = useI18n()

defineProps<{
  foundingCountByVertical: Record<string, number>
  uniqueVerticals: string[]
  foundingMaxPerVertical: number
}>()
</script>

<template>
  <div v-if="Object.keys(foundingCountByVertical).length" class="founding-stats">
    <div
      v-for="(count, vertical) in foundingCountByVertical"
      :key="vertical"
      class="founding-stat-card"
    >
      <span class="founding-label"
        >{{ t('admin.dealerSubscriptions.foundingCount') }} — {{ vertical }}</span
      >
      <span class="founding-value" :class="{ 'at-max': count >= foundingMaxPerVertical }">
        {{ count }} / {{ foundingMaxPerVertical }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.founding-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.founding-stat-card {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius, 8px);
  padding: var(--spacing-3) var(--spacing-4);
  box-shadow: var(--shadow-sm, var(--shadow-sm));
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  border-left: 4px solid var(--color-gold);
}

.founding-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, var(--text-secondary));
  font-weight: var(--font-weight-medium, 500);
}

.founding-value {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-gold);
}

.founding-value.at-max {
  color: var(--color-error);
}

@media (max-width: 48em) {
  .founding-stats {
    flex-direction: column;
  }
}

@media (max-width: 30em) {
  .founding-stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
