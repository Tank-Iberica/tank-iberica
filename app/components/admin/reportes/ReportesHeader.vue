<script setup lang="ts">
defineProps<{
  loading: boolean
  reportsCount: number
  pendingCount: number
  activeFilter: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="section-header">
    <div class="header-left">
      <h2>{{ t('report.admin.title') }}</h2>
      <span v-if="!loading" class="total-badge">{{ reportsCount }} total</span>
      <span v-if="pendingCount > 0 && activeFilter === 'all'" class="pending-badge">
        {{ pendingCount }} {{ t('report.admin.filterPending') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-gray-900);
}

.total-badge {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.85rem;
  font-weight: 500;
}

.pending-badge {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.85rem;
  font-weight: 600;
}

@media (min-width: 48em) {
  .section-header {
    flex-direction: row;
  }
}
</style>
