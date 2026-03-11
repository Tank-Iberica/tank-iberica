<script setup lang="ts">
/**
 * OnboardingTourCard — Fixed-position card showing guided tour steps.
 *
 * Works with useOnboardingTour composable.
 */
import type { TourStep } from '~/composables/useOnboardingTour'

defineProps<{
  visible: boolean
  step: TourStep | null
  stepNumber: number
  totalSteps: number
  isFirst: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  next: []
  prev: []
  skip: []
  action: [route: string]
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-card">
      <div
        v-if="visible && step"
        class="tour-card"
        role="dialog"
        aria-modal="false"
        :aria-label="step.title"
      >
        <div class="tour-card__header">
          <span class="tour-card__step-indicator"> {{ stepNumber }}/{{ totalSteps }} </span>
          <button type="button" class="tour-card__skip" @click="emit('skip')">
            {{ t('onboarding.skip') }}
          </button>
        </div>

        <h3 class="tour-card__title">{{ step.title }}</h3>
        <p class="tour-card__description">{{ step.description }}</p>

        <div class="tour-card__actions">
          <button
            v-if="!isFirst"
            type="button"
            class="tour-card__btn tour-card__btn--secondary"
            @click="emit('prev')"
          >
            {{ t('onboarding.prev') }}
          </button>

          <button
            v-if="step.actionLabel && step.actionRoute"
            type="button"
            class="tour-card__btn tour-card__btn--action"
            @click="emit('action', step.actionRoute!)"
          >
            {{ step.actionLabel }}
          </button>

          <button
            type="button"
            class="tour-card__btn tour-card__btn--primary"
            @click="emit('next')"
          >
            {{ isLast ? t('onboarding.finish') : t('onboarding.next') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-card {
  position: fixed;
  bottom: var(--spacing-4);
  left: var(--spacing-4);
  right: var(--spacing-4);
  z-index: 1000;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-4);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
  max-width: 24rem;
}

.tour-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.tour-card__step-indicator {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: 600;
}

.tour-card__skip {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-1) var(--spacing-2);
  min-height: 2.75rem;
}

.tour-card__skip:hover {
  color: var(--text-primary);
}

.tour-card__title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.tour-card__description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-4);
}

.tour-card__actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
}

.tour-card__btn {
  font-size: var(--font-size-sm);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
  min-height: 2.75rem;
}

.tour-card__btn--primary {
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
}

.tour-card__btn--secondary {
  background: transparent;
  color: var(--text-auxiliary);
  border-color: var(--border-color);
}

.tour-card__btn--action {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* Transition */
.tour-card-enter-active,
.tour-card-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tour-card-enter-from,
.tour-card-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

@media (min-width: 48em) {
  .tour-card {
    left: auto;
    right: var(--spacing-6);
    bottom: var(--spacing-6);
  }
}
</style>
