<script setup lang="ts">
defineProps<{
  stats: {
    total: number
    pending: number
    inTransit: number
    completedThisMonth: number
  }
}>()

const { t } = useI18n()
</script>

<template>
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-value">{{ stats.total }}</span>
      <span class="stat-label">{{ t('admin.transporte.statsTotal') }}</span>
    </div>
    <div class="stat-card stat-pending">
      <span class="stat-value">{{ stats.pending }}</span>
      <span class="stat-label">{{ t('admin.transporte.statsPending') }}</span>
    </div>
    <div class="stat-card stat-transit">
      <span class="stat-value">{{ stats.inTransit }}</span>
      <span class="stat-label">{{ t('admin.transporte.statsInTransit') }}</span>
    </div>
    <div class="stat-card stat-completed">
      <span class="stat-value">{{ stats.completedThisMonth }}</span>
      <span class="stat-label">{{ t('admin.transporte.statsCompletedMonth') }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.stat-card {
  flex: 1;
  min-width: 8.75rem;
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
  font-weight: 500;
}

.stat-card.stat-pending .stat-value {
  color: var(--color-warning);
}

.stat-card.stat-transit .stat-value {
  color: var(--color-focus);
}

.stat-card.stat-completed .stat-value {
  color: var(--color-success);
}

@media (min-width: 64em) {
  .stats-row {
    flex-wrap: nowrap;
  }
}
</style>
