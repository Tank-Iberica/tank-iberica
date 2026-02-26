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
  gap: 8px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-align: center;
}

.stat-pending .stat-value {
  color: #d97706;
}
.stat-processed .stat-value {
  color: #2563eb;
}
.stat-published .stat-value {
  color: #16a34a;
}
.stat-failed .stat-value {
  color: #dc2626;
}

/* 480px+ */
@media (min-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 768px+ */
@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
