<script setup lang="ts">
defineProps<{
  canReview: boolean
  reviewRating: number
  reviewTitle: string
  reviewContent: string
  submitting: boolean
  submitError: string | null
  submitSuccess: boolean
}>()

const emit = defineEmits<{
  (e: 'update-rating', value: number): void
  (e: 'update-title' | 'update-content', value: string): void
  (e: 'submit'): void
}>()
</script>

<template>
  <section v-if="canReview" class="review-form-section">
    <h2 class="section-title">{{ $t('seller.writeReview') }}</h2>

    <div v-if="submitSuccess" class="success-banner">
      {{ $t('seller.reviewSubmitted') }}
    </div>

    <form v-else class="review-form" @submit.prevent="emit('submit')">
      <!-- Rating selector -->
      <fieldset class="form-group">
        <legend class="form-label">{{ $t('seller.yourRating') }}</legend>
        <div class="rating-selector">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="rating-star-btn"
            :class="{ 'rating-star-btn--active': star <= reviewRating }"
            :aria-label="`${star} ${$t('seller.stars')}`"
            @click="emit('update-rating', star)"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28" aria-hidden="true">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </button>
        </div>
      </fieldset>

      <!-- Title -->
      <div class="form-group">
        <label for="review-title" class="form-label">{{ $t('seller.reviewTitleLabel') }}</label>
        <input
          id="review-title"
          type="text"
          class="form-input"
          :value="reviewTitle"
          :placeholder="$t('seller.reviewTitlePlaceholder')"
          maxlength="120"
          @input="emit('update-title', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Content -->
      <div class="form-group">
        <label for="review-content" class="form-label"
          >{{ $t('seller.reviewContentLabel') }} *</label
        >
        <textarea
          id="review-content"
          class="form-textarea"
          :value="reviewContent"
          :placeholder="$t('seller.reviewContentPlaceholder')"
          rows="4"
          maxlength="2000"
          required
          @input="emit('update-content', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <!-- Error -->
      <p v-if="submitError" class="form-error" role="alert">{{ submitError }}</p>

      <!-- Submit -->
      <button type="submit" class="btn-primary" :disabled="submitting">
        {{ submitting ? $t('common.loading') : $t('seller.submitReview') }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.review-form-section {
  max-width: 960px;
  margin: 0 auto var(--spacing-8);
  padding: 0 var(--spacing-4);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.success-banner {
  padding: var(--spacing-4);
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  border-radius: var(--border-radius);
  color: #065f46;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.review-form {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.form-group {
  margin-bottom: var(--spacing-4);
  border: none;
  padding: 0;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.rating-selector {
  display: flex;
  gap: var(--spacing-1);
}

.rating-star-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-gray-300);
  transition: color var(--transition-fast);
}

.rating-star-btn--active {
  color: var(--color-gold);
}

.form-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-textarea {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-3) var(--spacing-4);
  margin-bottom: var(--spacing-3);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .review-form-section {
    padding: 0 var(--spacing-8);
  }

  .section-title {
    font-size: var(--font-size-xl);
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .review-form {
    padding: var(--spacing-6);
  }
}
</style>
