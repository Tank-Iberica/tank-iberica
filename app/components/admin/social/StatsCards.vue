<template>
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">{{ counts.all }}</span>
      <span class="stat-label">{{ t('admin.social.stats.total') }}</span>
    </div>
    <div class="stat-card stat-pending">
      <span class="stat-value">{{ counts.pending }}</span>
      <span class="stat-label">{{ t('admin.social.stats.pending') }}</span>
    </div>
    <div class="stat-card stat-approved">
      <span class="stat-value">{{ counts.approved }}</span>
      <span class="stat-label">{{ t('admin.social.stats.approved') }}</span>
    </div>
    <div class="stat-card stat-posted">
      <span class="stat-value">{{ counts.posted }}</span>
      <span class="stat-label">{{ t('admin.social.stats.posted') }}</span>
    </div>
    <div class="stat-card stat-failed">
      <span class="stat-value">{{ counts.failed }}</span>
      <span class="stat-label">{{ t('admin.social.stats.failed') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  counts: {
    all: number
    pending: number
    approved: number
    posted: number
    rejected: number
    failed: number
  }
}>()
</script>

<style scoped>
@import './social-shared.css';
</style>
