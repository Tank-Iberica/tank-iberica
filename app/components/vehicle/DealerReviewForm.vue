<script setup lang="ts">
/**
 * DealerReviewForm — star rating + comment form.
 * Emits submit event with validated form data.
 */
const emit = defineEmits<{
  (e: 'submit', rating: number, comment: string): void
}>()

const { t } = useI18n()

const rating = ref(0)
const hoverRating = ref(0)
const comment = ref('')
const ratingError = ref(false)

function setRating(value: number): void {
  rating.value = value
  ratingError.value = false
}

function handleSubmit(): void {
  if (rating.value === 0) {
    ratingError.value = true
    return
  }
  emit('submit', rating.value, comment.value)
}

const displayRating = computed(() => hoverRating.value || rating.value)
</script>

<template>
  <form class="review-form" novalidate @submit.prevent="handleSubmit">
    <div class="form-group">
      <label class="form-label">{{ t('vehicle.reviews.ratingLabel') }}</label>
      <div
        class="star-picker"
        :class="{ 'star-picker--error': ratingError }"
        role="radiogroup"
        :aria-label="t('vehicle.reviews.ratingLabel')"
      >
        <button
          v-for="i in 5"
          :key="i"
          type="button"
          class="star-btn"
          :class="displayRating >= i ? 'star-active' : 'star-inactive'"
          :aria-label="`${i} ${t('vehicle.reviews.outOf5')}`"
          :aria-pressed="rating === i"
          @click="setRating(i)"
          @mouseenter="hoverRating = i"
          @mouseleave="hoverRating = 0"
        >
          ★
        </button>
      </div>
      <p v-if="ratingError" class="field-error" role="alert">
        {{ t('vehicle.reviews.ratingRequired') }}
      </p>
    </div>

    <div class="form-group">
      <label class="form-label" for="review-comment">
        {{ t('vehicle.reviews.commentLabel') }}
        <span class="optional-tag">{{ t('common.optional') }}</span>
      </label>
      <textarea
        id="review-comment"
        v-model="comment"
        class="form-textarea"
        autocomplete="off"
        :placeholder="t('vehicle.reviews.commentPlaceholder')"
        rows="3"
        maxlength="500"
      />
      <UiCharCounter :current="comment.length" :max="500" />
    </div>

    <button type="submit" class="submit-btn">
      {{ t('vehicle.reviews.submit') }}
    </button>
  </form>
</template>

<style scoped>
.review-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.optional-tag {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-disabled);
}

.star-picker {
  display: flex;
  gap: 0.25rem;
}

.star-picker--error .star-btn {
  border-color: var(--color-error);
}

.star-btn {
  min-height: 2.75rem;
  min-width: 2.75rem;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: transform 0.1s;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-active {
  color: var(--color-warning-text, #d97706);
}

.star-inactive {
  color: var(--color-gray-200);
}

.field-error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-error);
}

.form-textarea {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  resize: vertical;
  min-height: 5rem;
  font-family: inherit;
}

.form-textarea::placeholder {
  color: var(--text-disabled);
}

.submit-btn {
  min-height: 2.75rem;
  padding: 0 1.5rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
}

.submit-btn:hover {
  opacity: 0.9;
}
</style>
