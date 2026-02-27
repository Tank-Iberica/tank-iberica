<script setup lang="ts">
defineProps<{
  activeFilter: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="empty-state-container">
    <div class="empty-icon">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9CA3AF"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </div>
    <h3 class="empty-title">{{ t('report.admin.noReports') }}</h3>
    <p class="empty-description">
      {{
        activeFilter !== 'all'
          ? t('report.admin.noReportsFiltered')
          : t('report.admin.noReportsYet')
      }}
    </p>
  </div>
</template>

<style scoped>
.empty-state-container {
  background: white;
  border-radius: 8px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #374151;
}

.empty-description {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}
</style>
