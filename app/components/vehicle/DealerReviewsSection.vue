<script setup lang="ts">
import { useDealerReviews } from '~/composables/useDealerReviews'

const props = defineProps<{
  dealerId: string
}>()

const { t } = useI18n()
const user = useSupabaseUser()
const { reviews, loading, submitting, error, submitSuccess, averageRating, reviewCount, fetchReviews, submitReview } = useDealerReviews(props.dealerId)

const showForm = ref(false)

onMounted(fetchReviews)

async function handleSubmit(rating: number, comment: string): Promise<void> {
  const ok = await submitReview({ rating, comment })
  if (ok) {
    showForm.value = false
  }
}
</script>

<template>
  <section class="reviews-section" :aria-label="t('vehicle.reviews.sectionLabel')">
    <div class="reviews-header">
      <h3 class="reviews-title">{{ t('vehicle.reviews.title') }}</h3>
      <DealerRatingDisplay v-if="reviewCount > 0" :average="averageRating" :count="reviewCount" />
    </div>

    <div v-if="loading" class="reviews-loading" aria-busy="true">
      <UiSkeleton height="1.5rem" width="60%" />
      <UiSkeleton height="1rem" width="40%" />
    </div>

    <template v-else>
      <!-- Review list -->
      <div v-if="reviews.length > 0" class="reviews-list">
        <article v-for="review in reviews" :key="review.id" class="review-card">
          <div class="review-stars" aria-hidden="true">
            <span v-for="i in 5" :key="i" class="star" :class="i <= review.rating ? 'star-on' : 'star-off'">★</span>
          </div>
          <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
          <time class="review-date" :datetime="review.created_at">
            {{ new Date(review.created_at).toLocaleDateString() }}
          </time>
        </article>
      </div>

      <p v-else class="reviews-empty">{{ t('vehicle.reviews.noReviews') }}</p>

      <!-- Submit review CTA -->
      <div v-if="user && !showForm" class="reviews-cta">
        <button class="write-review-btn" @click="showForm = true">
          {{ t('vehicle.reviews.writeReview') }}
        </button>
      </div>

      <!-- Login prompt -->
      <p v-else-if="!user" class="reviews-login-hint">
        <NuxtLink to="/auth/login">{{ t('vehicle.reviews.loginToReview') }}</NuxtLink>
      </p>

      <!-- Review form -->
      <div v-if="showForm" class="reviews-form-wrapper">
        <div v-if="error" class="reviews-error" role="alert">{{ error }}</div>
        <div v-if="submitSuccess" class="reviews-success" role="status" aria-live="polite">
          {{ t('vehicle.reviews.successMessage') }}
        </div>
        <DealerReviewForm v-if="!submitSuccess" :disabled="submitting" @submit="handleSubmit" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.reviews-section {
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--color-gray-100);
}

.reviews-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  flex-wrap: wrap;
}

.reviews-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.reviews-loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.review-card {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.review-stars {
  display: flex;
  gap: 0.1rem;
}

.star-on {
  color: var(--color-warning-text, #d97706);
}

.star-off {
  color: var(--color-gray-200);
}

.review-comment {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.review-date {
  font-size: 0.75rem;
  color: var(--text-disabled);
}

.reviews-empty {
  margin: 0 0 var(--spacing-4);
  font-size: 0.9rem;
  color: var(--text-auxiliary);
  font-style: italic;
}

.reviews-cta {
  margin-bottom: var(--spacing-3);
}

.write-review-btn {
  min-height: 2.75rem;
  padding: 0 1.25rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.write-review-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.reviews-login-hint {
  margin: 0 0 var(--spacing-3);
  font-size: 0.875rem;
  color: var(--text-auxiliary);
}

.reviews-login-hint a {
  color: var(--color-primary);
}

.reviews-form-wrapper {
  margin-top: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.reviews-error {
  margin-bottom: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.875rem;
}

.reviews-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, #f0fdf4);
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-size: 0.875rem;
}
</style>
