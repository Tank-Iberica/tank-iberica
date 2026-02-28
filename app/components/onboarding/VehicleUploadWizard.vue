<template>
  <div class="upload-wizard">
    <!-- Progress bar -->
    <div class="wizard-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${overallProgress}%` }" />
      </div>
      <span class="progress-label">{{ overallProgress }}%</span>
    </div>

    <!-- Step indicators -->
    <div class="wizard-steps">
      <button
        v-for="(step, idx) in steps"
        :key="step.id"
        class="step-indicator"
        :class="{
          'step-indicator--completed': step.completed,
          'step-indicator--current': currentStep === step.id,
          'step-indicator--skipped': step.skipped,
        }"
        :aria-label="$t(step.label_key)"
        @click="goToStep(step.id)"
      >
        <span class="step-circle">
          <svg
            v-if="step.completed"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span v-else>{{ idx + 1 }}</span>
        </span>
        <span class="step-label">{{ $t(step.label_key) }}</span>
      </button>
    </div>

    <!-- Completion state -->
    <div v-if="isComplete" class="wizard-complete">
      <div class="confetti-container" aria-hidden="true">
        <span v-for="n in 20" :key="n" class="confetti-piece" :style="confettiStyle(n)" />
      </div>

      <div class="complete-content">
        <div class="complete-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 class="complete-title">{{ $t('onboarding.completeTitle') }}</h3>
        <p class="complete-subtitle">{{ $t('onboarding.completeSubtitle') }}</p>
      </div>
    </div>

    <!-- Active step content -->
    <div v-else class="wizard-content">
      <div
        v-for="step in steps"
        v-show="currentStep === step.id"
        :key="step.id"
        class="step-content"
      >
        <div class="step-header">
          <h3 class="step-title">{{ $t(step.label_key) }}</h3>
          <p class="step-description">{{ $t(`onboarding.descriptions.${step.id}`) }}</p>

          <!-- Validation status -->
          <div v-if="step.completed" class="step-validation step-validation--valid">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{{ $t('onboarding.stepCompleted') }}</span>
          </div>
          <div v-else-if="step.skipped" class="step-validation step-validation--skipped">
            <span>{{ $t('onboarding.stepSkipped') }}</span>
          </div>
        </div>

        <!-- Slot area: parent page injects actual form fields here -->
        <div class="step-slot">
          <slot :name="step.id" :step="step" />
        </div>

        <!-- Step actions -->
        <div class="step-actions">
          <button class="btn-complete" @click="completeStep(step.id)">
            {{ $t('onboarding.markComplete') }}
          </button>
          <button v-if="!step.required" class="btn-skip" @click="skipStep(step.id)">
            {{ $t('onboarding.skip') }}
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <div class="wizard-nav">
        <button
          class="nav-btn nav-btn--prev"
          :disabled="currentStepIndex <= 0"
          @click="goToPrevious"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {{ $t('onboarding.previous') }}
        </button>
        <button
          class="nav-btn nav-btn--next"
          :disabled="currentStepIndex >= steps.length - 1"
          @click="goToNext"
        >
          {{ $t('onboarding.next') }}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOnboarding } from '~/composables/useOnboarding'
import type { StepId } from '~/composables/useOnboarding'

const props = defineProps<{
  vehicleId?: string
}>()

const { steps, currentStep, overallProgress, isComplete, completeStep, skipStep, goToStep } =
  useOnboarding(props.vehicleId)

const currentStepIndex = computed(() => steps.value.findIndex((s) => s.id === currentStep.value))

function goToPrevious(): void {
  const idx = currentStepIndex.value
  if (idx > 0) {
    goToStep(steps.value[idx - 1]!.id as StepId)
  }
}

function goToNext(): void {
  const idx = currentStepIndex.value
  if (idx < steps.value.length - 1) {
    goToStep(steps.value[idx + 1]!.id as StepId)
  }
}

// CSS-only confetti animation: generate varied styles per piece
const CONFETTI_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function confettiStyle(n: number): Record<string, string> {
  const color = CONFETTI_COLORS[n % CONFETTI_COLORS.length] ?? '#10b981'
  const left = `${(n * 17 + 5) % 100}%`
  const delay = `${(n * 0.15) % 2}s`
  const duration = `${1.5 + (n % 3) * 0.5}s`
  const size = `${4 + (n % 3) * 2}px`

  return {
    '--confetti-color': color,
    left,
    animationDelay: delay,
    animationDuration: duration,
    width: size,
    height: size,
  }
}
</script>

<style scoped>
.upload-wizard {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

/* Progress bar */
.wizard-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--border-radius-full);
  transition: width 0.4s ease-out;
}

.progress-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  min-width: 36px;
  text-align: right;
}

/* Step indicators */
.wizard-steps {
  display: flex;
  gap: var(--spacing-1);
  overflow-x: auto;
  padding-bottom: var(--spacing-1);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.wizard-steps::-webkit-scrollbar {
  display: none;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 56px;
  padding: var(--spacing-1);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.step-indicator:hover {
  opacity: 0.8;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border: 2px solid var(--border-color);
  color: var(--text-auxiliary);
  background: var(--bg-primary);
  transition: all var(--transition-fast);
}

.step-indicator--completed .step-circle {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-white);
}

.step-indicator--current .step-circle {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.step-indicator--skipped .step-circle {
  border-color: var(--color-warning);
  color: var(--color-warning);
  border-style: dashed;
}

.step-label {
  font-size: 10px;
  color: var(--text-auxiliary);
  text-align: center;
  line-height: 1.2;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-indicator--current .step-label {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.step-indicator--completed .step-label {
  color: var(--color-success);
}

/* Step content */
.wizard-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.step-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.step-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.step-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.step-validation {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.step-validation--valid {
  color: var(--color-success);
}

.step-validation--skipped {
  color: var(--color-warning);
}

.step-slot {
  min-height: 40px;
}

/* Step actions */
.step-actions {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.btn-complete {
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-complete:hover {
  background: var(--color-primary-dark);
}

.btn-skip {
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  background: none;
  color: var(--text-auxiliary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-skip:hover {
  border-color: var(--text-auxiliary);
  color: var(--text-secondary);
}

/* Navigation */
.wizard-nav {
  display: flex;
  justify-content: space-between;
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Completion state */
.wizard-complete {
  position: relative;
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  overflow: hidden;
}

.complete-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.complete-icon {
  color: var(--color-success);
}

.complete-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.complete-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* CSS-only confetti */
.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  background: var(--confetti-color, #10b981);
  border-radius: 2px;
  opacity: 0;
  animation: confetti-fall 2s ease-in forwards;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(300px) rotate(720deg);
  }
}

/* Desktop */
@media (min-width: 768px) {
  .upload-wizard {
    padding: var(--spacing-6);
  }

  .wizard-steps {
    gap: var(--spacing-2);
    justify-content: center;
  }

  .step-indicator {
    min-width: 72px;
  }

  .step-label {
    font-size: var(--font-size-xs);
    max-width: 80px;
  }
}

@media (min-width: 1024px) {
  .step-indicator {
    min-width: 88px;
  }

  .step-label {
    max-width: 100px;
    white-space: normal;
  }
}
</style>
