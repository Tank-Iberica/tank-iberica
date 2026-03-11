<script setup lang="ts">
defineProps<{
  stats: {
    total: number
    new: number
    contacted: number
    interested: number
    active: number
  }
}>()

const { t } = useI18n()
</script>

<template>
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-value">{{ stats.total }}</span>
      <span class="stat-label">{{ t('admin.captacion.totalLeads') }}</span>
    </div>
    <div class="stat-card stat-new">
      <span class="stat-value">{{ stats.new }}</span>
      <span class="stat-label">{{ t('admin.captacion.newCount') }}</span>
    </div>
    <div class="stat-card stat-contacted">
      <span class="stat-value">{{ stats.contacted }}</span>
      <span class="stat-label">{{ t('admin.captacion.contactedCount') }}</span>
    </div>
    <div class="stat-card stat-interested">
      <span class="stat-value">{{ stats.interested }}</span>
      <span class="stat-label">{{ t('admin.captacion.interestedCount') }}</span>
    </div>
    <div class="stat-card stat-active">
      <span class="stat-value">{{ stats.active }}</span>
      <span class="stat-label">{{ t('admin.captacion.activeCount') }}</span>
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
  min-width: 7.5rem;
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

.stat-card.stat-new .stat-value {
  color: var(--color-focus);
}

.stat-card.stat-contacted .stat-value {
  color: var(--color-warning);
}

.stat-card.stat-interested .stat-value {
  color: var(--color-success);
}

.stat-card.stat-active .stat-value {
  color: var(--color-success-dark);
}

@media (min-width: 64em) {
  .stats-row {
    flex-wrap: nowrap;
  }
}
</style>
