<script setup lang="ts">
/**
 * DealerRatingDisplay — compact star rating badge for dealer profiles.
 * Shows average rating (1 decimal) and review count.
 */
defineProps<{
  average: number
  count: number
}>()

const { t } = useI18n()

function starClass(starIndex: number, average: number): string {
  if (average >= starIndex) return 'star-full'
  if (average >= starIndex - 0.5) return 'star-half'
  return 'star-empty'
}
</script>

<template>
  <div v-if="count > 0" class="dealer-rating" :aria-label="`${average} ${t('vehicle.reviews.outOf5')}, ${count} ${t('vehicle.reviews.reviewsCount', count)}`">
    <span class="rating-stars" aria-hidden="true">
      <span v-for="i in 5" :key="i" class="star" :class="starClass(i, average)">★</span>
    </span>
    <span class="rating-value">{{ average.toFixed(1) }}</span>
    <span class="rating-count">({{ count }})</span>
  </div>
</template>

<style scoped>
.dealer-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.rating-stars {
  display: inline-flex;
  gap: 0.05rem;
  color: var(--color-warning-text, #d97706);
}

.star-empty {
  color: var(--color-gray-200);
}

.star-half {
  position: relative;
  color: var(--color-gray-200);
}

.star-half::before {
  content: '★';
  position: absolute;
  left: 0;
  width: 50%;
  overflow: hidden;
  color: var(--color-warning-text, #d97706);
}

.rating-value {
  font-weight: 700;
  color: var(--text-primary);
}

.rating-count {
  color: var(--text-auxiliary);
}
</style>
