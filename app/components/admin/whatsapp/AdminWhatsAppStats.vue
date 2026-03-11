<script setup lang="ts">
defineProps<{
  statusCounts: {
    all: number
    received: number
    processing: number
    processed: number
    published: number
    failed: number
  }
  pendingCount: number
}>()

const { t } = useI18n()
</script>

<template>
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">{{ statusCounts.all }}</span>
      <span class="stat-label">{{ t('admin.whatsapp.stats.total') }}</span>
    </div>
    <div class="stat-card stat-pending">
      <span class="stat-value">{{ pendingCount }}</span>
      <span class="stat-label">{{ t('admin.whatsapp.stats.pending') }}</span>
    </div>
    <div class="stat-card stat-processed">
      <span class="stat-value">{{ statusCounts.processed }}</span>
      <span class="stat-label">{{ t('admin.whatsapp.stats.processed') }}</span>
    </div>
    <div class="stat-card stat-published">
      <span class="stat-value">{{ statusCounts.published }}</span>
      <span class="stat-label">{{ t('admin.whatsapp.stats.published') }}</span>
    </div>
    <div class="stat-card stat-failed">
      <span class="stat-value">{{ statusCounts.failed }}</span>
      <span class="stat-label">{{ t('admin.whatsapp.stats.failed') }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-auxiliary);
  font-weight: 500;
  text-align: center;
}

.stat-pending .stat-value {
  color: var(--color-warning);
}
.stat-processed .stat-value {
  color: var(--color-focus);
}
.stat-published .stat-value {
  color: var(--color-success);
}
.stat-failed .stat-value {
  color: var(--color-error);
}

/* 30em+ */
@media (min-width: 30em) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 48em+ */
@media (min-width: 48em) {
  .stats-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
