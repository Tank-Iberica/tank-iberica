<script setup lang="ts">
defineProps<{
  activeListings: number
  totalReviews: number
  avgRating: number
  responseRateFormatted: string
}>()
</script>

<template>
  <section class="stats-row">
    <div class="stat-card">
      <span class="stat-value">{{ activeListings }}</span>
      <span class="stat-label">{{ $t('seller.activeVehicles') }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{{ totalReviews }}</span>
      <span class="stat-label">{{ $t('seller.totalReviews') }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{{ avgRating > 0 ? avgRating : '--' }}</span>
      <span class="stat-label">{{ $t('seller.avgRating') }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{{ responseRateFormatted }}</span>
      <span class="stat-label">{{ $t('seller.responseRate') }}</span>
    </div>
  </section>
</template>

<style scoped>
.stats-row {
  max-width: 960px;
  margin: 0 auto var(--spacing-8);
  padding: 0 var(--spacing-4);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.stat-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(4, 1fr);
    padding: 0 var(--spacing-8);
  }
}
</style>
