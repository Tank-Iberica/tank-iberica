import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingTour, BUYER_TOUR_KEY, type TourStep } from '~/composables/useOnboardingTour'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const steps: TourStep[] = [
  { key: 'welcome', title: 'Welcome', description: 'Introduction to the panel.' },
  {
    key: 'publish',
    title: 'Publish',
    description: 'Add your first vehicle.',
    actionLabel: 'Go publish',
    actionRoute: '/dashboard/vehiculos/nuevo',
  },
  { key: 'leads', title: 'Leads', description: 'Reply to buyers.' },
]

function makeTour(s = steps) {
  return useOnboardingTour(s)
}

// ---------------------------------------------------------------------------
// Reset localStorage before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('visible is false on creation', () => {
    const tour = makeTour()
    expect(tour.visible.value).toBe(false)
  })

  it('currentIndex starts at 0', () => {
    const tour = makeTour()
    expect(tour.currentIndex.value).toBe(0)
  })

  it('totalSteps equals the number of steps', () => {
    const tour = makeTour()
    expect(tour.totalSteps).toBe(steps.length)
  })

  it('stepNumber is 1 initially', () => {
    const tour = makeTour()
    expect(tour.stepNumber.value).toBe(1)
  })

  it('isFirst is true initially', () => {
    const tour = makeTour()
    expect(tour.isFirst.value).toBe(true)
  })

  it('isLast is false when multiple steps', () => {
    const tour = makeTour()
    expect(tour.isLast.value).toBe(false)
  })

  it('currentStep is the first step', () => {
    const tour = makeTour()
    expect(tour.currentStep.value?.key).toBe('welcome')
  })
})

// ---------------------------------------------------------------------------
// startTour / hasSeenTour
// ---------------------------------------------------------------------------

describe('startTour', () => {
  it('makes tour visible', () => {
    const tour = makeTour()
    tour.startTour()
    expect(tour.visible.value).toBe(true)
  })

  it('does nothing if tour was already seen (localStorage set)', () => {
    localStorage.setItem('tracciona:tour:dealer:v1', '1')
    const tour = makeTour()
    tour.startTour()
    expect(tour.visible.value).toBe(false)
  })

  it('hasSeenTour returns false before tour is completed', () => {
    const tour = makeTour()
    expect(tour.hasSeenTour()).toBe(false)
  })

  it('hasSeenTour returns true after localStorage key is set externally', () => {
    localStorage.setItem('tracciona:tour:dealer:v1', '1')
    const tour = makeTour()
    expect(tour.hasSeenTour()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe('nextStep', () => {
  it('advances to next step', () => {
    const tour = makeTour()
    tour.startTour()
    tour.nextStep()
    expect(tour.currentIndex.value).toBe(1)
    expect(tour.currentStep.value?.key).toBe('publish')
  })

  it('advances stepNumber', () => {
    const tour = makeTour()
    tour.startTour()
    tour.nextStep()
    expect(tour.stepNumber.value).toBe(2)
  })

  it('completes tour on last step', () => {
    const tour = makeTour()
    tour.startTour()
    tour.nextStep() // step 2
    tour.nextStep() // step 3
    tour.nextStep() // completes
    expect(tour.visible.value).toBe(false)
    expect(localStorage.getItem('tracciona:tour:dealer:v1')).toBe('1')
  })

  it('isLast is true on last step', () => {
    const tour = makeTour()
    tour.startTour()
    tour.nextStep()
    tour.nextStep()
    expect(tour.isLast.value).toBe(true)
  })
})

describe('prevStep', () => {
  it('goes back to previous step', () => {
    const tour = makeTour()
    tour.startTour()
    tour.nextStep()
    tour.prevStep()
    expect(tour.currentIndex.value).toBe(0)
  })

  it('does nothing when on first step', () => {
    const tour = makeTour()
    tour.startTour()
    tour.prevStep()
    expect(tour.currentIndex.value).toBe(0)
  })

  it('isFirst becomes false when not on step 0', () => {
    const tour = makeTour()
    tour.startTour()
    tour.nextStep()
    expect(tour.isFirst.value).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// skipTour / completeTour
// ---------------------------------------------------------------------------

describe('skipTour', () => {
  it('hides the tour', () => {
    const tour = makeTour()
    tour.startTour()
    tour.skipTour()
    expect(tour.visible.value).toBe(false)
  })

  it('marks tour as seen in localStorage', () => {
    const tour = makeTour()
    tour.startTour()
    tour.skipTour()
    expect(localStorage.getItem('tracciona:tour:dealer:v1')).toBe('1')
  })

  it('prevents re-showing after skip', () => {
    const tour = makeTour()
    tour.startTour()
    tour.skipTour()
    tour.startTour()
    expect(tour.visible.value).toBe(false)
  })
})

describe('completeTour', () => {
  it('hides the tour', () => {
    const tour = makeTour()
    tour.startTour()
    tour.completeTour()
    expect(tour.visible.value).toBe(false)
  })

  it('sets localStorage key', () => {
    const tour = makeTour()
    tour.startTour()
    tour.completeTour()
    expect(localStorage.getItem('tracciona:tour:dealer:v1')).toBe('1')
  })
})

// ---------------------------------------------------------------------------
// Single-step edge case
// ---------------------------------------------------------------------------

describe('single step tour', () => {
  it('isFirst and isLast are both true', () => {
    const single = [{ key: 's1', title: 'Only step', description: 'One and done.' }]
    const tour = makeTour(single)
    tour.startTour()
    expect(tour.isFirst.value).toBe(true)
    expect(tour.isLast.value).toBe(true)
  })

  it('nextStep completes tour immediately', () => {
    const single = [{ key: 's1', title: 'Only step', description: 'One and done.' }]
    const tour = makeTour(single)
    tour.startTour()
    tour.nextStep()
    expect(tour.visible.value).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Custom storage key (buyer tour)
// ---------------------------------------------------------------------------

describe('custom storage key', () => {
  it('uses custom key for localStorage', () => {
    const tour = useOnboardingTour(steps, BUYER_TOUR_KEY)
    tour.startTour()
    tour.completeTour()
    expect(localStorage.getItem(BUYER_TOUR_KEY)).toBe('1')
    // Dealer key untouched
    expect(localStorage.getItem('tracciona:tour:dealer:v1')).toBeNull()
  })

  it('two tours with different keys are independent', () => {
    const dealerTour = useOnboardingTour(steps, 'tracciona:tour:dealer:v1')
    const buyerTour = useOnboardingTour(steps, BUYER_TOUR_KEY)

    dealerTour.startTour()
    dealerTour.completeTour()

    // Buyer tour is not affected
    buyerTour.startTour()
    expect(buyerTour.visible.value).toBe(true)
  })
})
