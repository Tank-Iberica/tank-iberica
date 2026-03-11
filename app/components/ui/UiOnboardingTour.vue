<script setup lang="ts">
import type { TourStep } from '~/composables/useOnboardingTour'

defineProps<{
  visible: boolean
  currentStep: TourStep | null
  stepNumber: number
  totalSteps: number
  isFirst: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  (e: 'next' | 'prev' | 'skip'): void
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-slide">
      <div
        v-if="visible && currentStep"
        class="tour-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="t('tour.label')"
      >
        <div class="tour-card">
          <!-- Header row -->
          <div class="tour-header">
            <span class="tour-badge" aria-live="polite">
              {{ stepNumber }} / {{ totalSteps }}
            </span>
            <button
              class="tour-skip"
              :aria-label="t('tour.skip')"
              @click="emit('skip')"
            >
              {{ t('tour.skip') }}
            </button>
          </div>

          <!-- Content -->
          <h3 class="tour-title">{{ currentStep.title }}</h3>
          <p class="tour-desc">{{ currentStep.description }}</p>

          <!-- Optional CTA -->
          <NuxtLink
            v-if="currentStep.actionRoute && currentStep.actionLabel"
            :to="currentStep.actionRoute"
            class="tour-action"
            @click="emit('next')"
          >
            {{ currentStep.actionLabel }}
          </NuxtLink>

          <!-- Footer navigation -->
          <div class="tour-footer">
            <button
              v-if="!isFirst"
              class="btn-ghost-sm"
              @click="emit('prev')"
            >
              {{ t('tour.prev') }}
            </button>
            <div v-else class="tour-spacer" />

            <!-- Step dots -->
            <div class="tour-dots" aria-hidden="true">
              <span
                v-for="i in totalSteps"
                :key="i"
                class="tour-dot"
                :class="{ 'tour-dot--active': i === stepNumber }"
              />
            </div>

            <button class="btn-primary-sm" @click="emit('next')">
              {{ isLast ? t('tour.finish') : t('tour.next') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 1000);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--spacing-4);
  pointer-events: none;
}

.tour-card {
  width: 100%;
  max-width: 32rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-5) var(--spacing-6);
  pointer-events: all;
  margin-bottom: env(safe-area-inset-bottom, 0px);
}

/* Header */
.tour-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-3);
}

.tour-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.02em;
}

.tour-skip {
  background: none;
  border: none;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 0.25rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
  min-height: 2.75rem;
  transition: color var(--transition-fast);
}

.tour-skip:hover {
  color: var(--text-secondary);
}

/* Content */
.tour-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2);
}

.tour-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-4);
}

/* Optional CTA */
.tour-action {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-4);
  margin-bottom: var(--spacing-4);
  background: var(--color-primary-light, var(--color-primary));
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 2.75rem;
}

.tour-action:hover {
  background: var(--color-primary-dark);
}

/* Footer */
.tour-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  margin-top: var(--spacing-2);
}

.tour-spacer {
  min-width: 5rem;
}

/* Step dots */
.tour-dots {
  display: flex;
  gap: 0.375rem;
}

.tour-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--border-radius-full);
  background: var(--border-color);
  transition: background var(--transition-fast);
}

.tour-dot--active {
  background: var(--color-primary);
}

/* Buttons */
.btn-ghost-sm {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-height: 2.75rem;
  transition: background var(--transition-fast);
}

.btn-ghost-sm:hover {
  background: var(--bg-secondary);
}

.btn-primary-sm {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  min-height: 2.75rem;
  transition: background var(--transition-fast);
}

.btn-primary-sm:hover {
  background: var(--color-primary-dark);
}

/* Transition */
.tour-slide-enter-active,
.tour-slide-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.tour-slide-enter-from,
.tour-slide-leave-to {
  transform: translateY(2rem);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tour-slide-enter-active,
  .tour-slide-leave-active {
    transition: opacity 0.01ms !important;
  }
}

@media (min-width: 48em) {
  .tour-overlay {
    align-items: flex-end;
    justify-content: flex-end;
    padding: var(--spacing-6);
  }

  .tour-card {
    max-width: 26rem;
  }
}
</style>
