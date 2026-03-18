<script setup lang="ts">
/**
 * FeedbackWidget — "Was this helpful?" thumbs up/down + optional comment.
 * Tracks into analytics_events via useAnalyticsTracking().trackFeedback().
 * Place on key pages: vehicle detail, search results, pricing, etc.
 */
import { useAnalyticsTracking } from '~/composables/useAnalyticsTracking'

const props = withDefaults(
  defineProps<{
    /** Identifier for which page/section this feedback is from */
    page: string
    /** Optional question text override */
    question?: string
  }>(),
  {
    question: '',
  },
)

const { t } = useI18n()
const { trackFeedback } = useAnalyticsTracking()

const state = ref<'idle' | 'comment' | 'done'>('idle')
const selected = ref<boolean | null>(null)
const comment = ref('')

function onVote(helpful: boolean) {
  selected.value = helpful
  if (helpful) {
    // Positive: track immediately, show thank you
    trackFeedback(props.page, true)
    state.value = 'done'
  } else {
    // Negative: show comment box for optional feedback
    state.value = 'comment'
  }
}

function submitComment() {
  trackFeedback(props.page, false, comment.value.trim() || undefined)
  state.value = 'done'
}

function skipComment() {
  trackFeedback(props.page, false)
  state.value = 'done'
}
</script>

<template>
  <div class="feedback-widget" role="region" :aria-label="t('feedback.ariaLabel', 'Feedback')">
    <!-- Idle: show question + thumbs -->
    <template v-if="state === 'idle'">
      <span class="feedback-question">
        {{ question || t('feedback.question', 'Was this helpful?') }}
      </span>
      <div class="feedback-buttons">
        <button
          type="button"
          class="feedback-btn feedback-btn--up"
          :aria-label="t('feedback.yes', 'Yes')"
          @click="onVote(true)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M6 9V17H4C3.45 17 3 16.55 3 16V10C3 9.45 3.45 9 4 9H6ZM8 17H13.5C14.22 17 14.84 16.5 14.97 15.8L16.22 9.8C16.39 8.91 15.71 8.09 14.8 8.09H11V4C11 3.45 10.55 3 10 3L8 8V17Z"
              fill="currentColor"
            />
          </svg>
          <span>{{ t('feedback.yes', 'Yes') }}</span>
        </button>
        <button
          type="button"
          class="feedback-btn feedback-btn--down"
          :aria-label="t('feedback.no', 'No')"
          @click="onVote(false)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M14 11V3H16C16.55 3 17 3.45 17 4V10C17 10.55 16.55 11 16 11H14ZM12 3H6.5C5.78 3 5.16 3.5 5.03 4.2L3.78 10.2C3.61 11.09 4.29 11.91 5.2 11.91H9V16C9 16.55 9.45 17 10 17L12 12V3Z"
              fill="currentColor"
            />
          </svg>
          <span>{{ t('feedback.no', 'No') }}</span>
        </button>
      </div>
    </template>

    <!-- Comment: show textarea for negative feedback -->
    <template v-else-if="state === 'comment'">
      <span class="feedback-question">
        {{ t('feedback.commentPrompt', 'How can we improve?') }}
      </span>
      <textarea
        v-model="comment"
        class="feedback-textarea"
        rows="2"
        maxlength="500"
        :placeholder="t('feedback.commentPlaceholder', 'Tell us what went wrong...')"
      />
      <UiCharCounter :current="comment.length" :max="500" />
      <div class="feedback-actions">
        <button type="button" class="feedback-btn feedback-btn--submit" @click="submitComment">
          {{ t('feedback.send', 'Send') }}
        </button>
        <button type="button" class="feedback-btn feedback-btn--skip" @click="skipComment">
          {{ t('feedback.skip', 'Skip') }}
        </button>
      </div>
    </template>

    <!-- Done: thank you -->
    <template v-else>
      <span class="feedback-thanks">
        {{ t('feedback.thanks', 'Thanks for your feedback!') }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.feedback-widget {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-secondary);
  border: 1px solid var(--color-gray-100);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
}

.feedback-question {
  color: var(--text-secondary);
  font-weight: 500;
}

.feedback-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.feedback-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  min-height: 2.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

@media (hover: hover) {
  .feedback-btn--up:hover {
    border-color: var(--color-success);
    color: var(--color-success);
    background: var(--color-success-bg, var(--bg-secondary));
  }

  .feedback-btn--down:hover {
    border-color: var(--color-error);
    color: var(--color-error);
    background: var(--color-error-bg, var(--bg-secondary));
  }
}

.feedback-btn--submit {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.feedback-btn--skip {
  background: transparent;
  border-color: transparent;
  color: var(--text-auxiliary);
}

.feedback-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 3.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.feedback-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.feedback-actions {
  display: flex;
  gap: var(--spacing-2);
  width: 100%;
}

.feedback-thanks {
  color: var(--color-success);
  font-weight: 500;
}
</style>
