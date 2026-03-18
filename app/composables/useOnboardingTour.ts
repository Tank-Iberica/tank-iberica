/**
 * Composable for the step-by-step guided onboarding tour.
 *
 * Shows a fixed-position tour card the first time a user visits.
 * Uses localStorage to remember if the tour was already seen.
 * Each call site defines its own steps and a unique storage key.
 *
 * Storage keys:
 *   - Dealer dashboard: 'tracciona:tour:dealer:v1'
 *   - Buyer profile:    'tracciona:tour:buyer:v1'
 */
import { ref, computed, readonly } from 'vue'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TourStep {
  /** Unique identifier for the step (used for key binding) */
  key: string
  /** Translated title displayed in the card */
  title: string
  /** Translated body description */
  description: string
  /** Optional CTA button label */
  actionLabel?: string
  /** Optional router path for the CTA button */
  actionRoute?: string
}

/** Default storage key (dealer tour). Bump version to reset for all users. */
export const DEALER_TOUR_KEY = 'tracciona:tour:dealer:v1'
export const BUYER_TOUR_KEY = 'tracciona:tour:buyer:v1'

// ---------------------------------------------------------------------------
// Safe localStorage helpers (no-op in SSR)
// ---------------------------------------------------------------------------

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // noop in SSR or restricted environments
  }
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * Composable for onboarding tour.
 *
 * @param steps
 * @param storageKey
 */
export function useOnboardingTour(steps: TourStep[], storageKey: string = DEALER_TOUR_KEY) {
  const currentIndex = ref(0)
  const visible = ref(false)

  // Derived state

  const currentStep = computed<TourStep | null>(() => steps[currentIndex.value] ?? null)
  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === steps.length - 1)
  const stepNumber = computed(() => currentIndex.value + 1)
  const totalSteps = steps.length

  // Actions

  function hasSeenTour(): boolean {
    return safeGetItem(storageKey) === '1'
  }

  function startTour(): void {
    if (hasSeenTour()) return
    currentIndex.value = 0
    visible.value = true
  }

  function nextStep(): void {
    if (isLast.value) {
      completeTour()
    } else {
      currentIndex.value++
    }
  }

  function prevStep(): void {
    if (!isFirst.value) {
      currentIndex.value--
    }
  }

  function skipTour(): void {
    completeTour()
  }

  function completeTour(): void {
    visible.value = false
    safeSetItem(storageKey, '1')
  }

  return {
    visible: readonly(visible),
    currentStep,
    currentIndex: readonly(currentIndex),
    isFirst,
    isLast,
    stepNumber,
    totalSteps,
    hasSeenTour,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  }
}
