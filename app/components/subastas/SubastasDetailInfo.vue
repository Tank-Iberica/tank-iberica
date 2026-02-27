<template>
  <div class="auction-details-section">
    <h2 class="section-heading">{{ $t('auction.detailsTitle') }}</h2>

    <!-- Description -->
    <p v-if="description" class="auction-description">
      {{ description }}
    </p>

    <!-- Key data grid -->
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">{{ $t('auction.startPrice') }}</span>
        <span class="detail-value">{{ startPrice }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">{{ $t('auction.bidIncrement') }}</span>
        <span class="detail-value">{{ bidIncrement }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">{{ $t('auction.buyerPremium') }}</span>
        <span class="detail-value">{{ buyerPremiumPct }}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">{{ $t('auction.depositRequired') }}</span>
        <span class="detail-value">{{ deposit }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">{{ $t('auction.startDate') }}</span>
        <span class="detail-value">{{ startDate }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">{{ $t('auction.endDate') }}</span>
        <span class="detail-value">{{ endDate }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description: string | null
  startPrice: string
  bidIncrement: string
  buyerPremiumPct: number
  deposit: string
  startDate: string
  endDate: string
}>()
</script>

<style scoped>
.auction-details-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.section-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.auction-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-4);
  white-space: pre-line;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.detail-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

@media (min-width: 480px) {
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .auction-details-section {
    padding: var(--spacing-6);
  }

  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .details-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
