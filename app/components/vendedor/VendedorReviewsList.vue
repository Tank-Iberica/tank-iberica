<script setup lang="ts">
import { renderStars } from '~/composables/useVendedorDetail'
import type { VendedorReview } from '~/composables/useVendedorDetail'

defineProps<{
  reviews: VendedorReview[]
  reviewsLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'load-more'): void
}>()
</script>

<template>
  <section class="reviews-section">
    <h2 class="section-title">{{ $t('seller.reviewsTitle') }}</h2>

    <div v-if="reviewsLoading" class="loading-state">
      {{ $t('common.loading') }}
    </div>

    <div v-else-if="reviews.length === 0" class="empty-reviews">
      <p>{{ $t('seller.noReviews') }}</p>
    </div>

    <div v-else class="reviews-list">
      <article v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-card__header">
          <span class="review-stars" aria-hidden="true">{{ renderStars(review.rating) }}</span>
          <span class="review-rating">{{ review.rating }}/5</span>
          <span v-if="review.verified_purchase" class="review-verified">
            {{ $t('seller.verifiedPurchase') }}
          </span>
        </div>
        <h3 v-if="review.title" class="review-title">{{ review.title }}</h3>
        <p v-if="review.content" class="review-content">{{ review.content }}</p>
        <div class="review-footer">
          <span class="review-author">{{ review.reviewer_name || $t('seller.anonymous') }}</span>
          <time class="review-date" :datetime="review.created_at">
            {{ new Date(review.created_at).toLocaleDateString() }}
          </time>
        </div>
      </article>

      <button
        v-if="reviews.length >= 10"
        class="btn-load-more"
        :disabled="reviewsLoading"
        @click="emit('load-more')"
      >
        {{ $t('seller.loadMoreReviews') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.reviews-section {
  max-width: 960px;
  margin: 0 auto var(--spacing-8);
  padding: 0 var(--spacing-4);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.empty-reviews {
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.review-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.review-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.review-stars {
  color: var(--color-gold);
  font-size: var(--font-size-sm);
  letter-spacing: 1px;
}

.review-rating {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.review-verified {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}

.review-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.review-content {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-3);
}

.review-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.review-author {
  font-weight: var(--font-weight-medium);
}

.btn-load-more {
  display: block;
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-load-more:hover {
  background: var(--bg-secondary);
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .reviews-section {
    padding: 0 var(--spacing-8);
  }

  .section-title {
    font-size: var(--font-size-xl);
  }
}
</style>
