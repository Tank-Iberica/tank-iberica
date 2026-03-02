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
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.total-badge {
  background: var(--bg-secondary);
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.pending-badge {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
}

@media (min-width: 768px) {
  .section-header {
    flex-direction: row;
  }
}
</style>
