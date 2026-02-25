/**
 * Composable for guided onboarding during vehicle uploads.
 * Manages a step checklist with validation and photo quality checks.
 * All client-side — No Supabase dependency.
 */

type StepId =
  | 'basic_info'
  | 'photos'
  | 'description'
  | 'price'
  | 'location'
  | 'attributes'
  | 'preview'

interface OnboardingStep {
  id: StepId
  label_key: string
  completed: boolean
  skipped: boolean
  required: boolean
}

interface PhotoValidation {
  valid: boolean
  errors: string[]
}

const STEP_DEFAULTS: ReadonlyArray<Omit<OnboardingStep, 'completed' | 'skipped'>> = [
  { id: 'basic_info', label_key: 'onboarding.steps.basicInfo', required: true },
  { id: 'photos', label_key: 'onboarding.steps.photos', required: true },
  { id: 'description', label_key: 'onboarding.steps.description', required: true },
  { id: 'price', label_key: 'onboarding.steps.price', required: true },
  { id: 'location', label_key: 'onboarding.steps.location', required: true },
  { id: 'attributes', label_key: 'onboarding.steps.attributes', required: false },
  { id: 'preview', label_key: 'onboarding.steps.preview', required: true },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MIN_WIDTH = 800
const MIN_HEIGHT = 600
const MIN_PHOTOS = 3
const MIN_DESCRIPTION_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_PRICE = 10_000_000
const MIN_YEAR = 1970

function buildStorageKey(vehicleId: string | undefined): string {
  return `tracciona_onboarding_${vehicleId || 'new'}`
}

function createDefaultSteps(): OnboardingStep[] {
  return STEP_DEFAULTS.map((s) => ({
    ...s,
    completed: false,
    skipped: false,
  }))
}

function findFirstIncompleteRequired(stepList: OnboardingStep[]): StepId {
  const found = stepList.find((s) => s.required && !s.completed)
  return found?.id ?? 'preview'
}

export function useOnboarding(vehicleId?: string) {
  const steps = ref<OnboardingStep[]>(createDefaultSteps())
  const currentStep = ref<StepId>('basic_info')

  // --- Persistence -----------------------------------------------------------

  function loadFromStorage(): void {
    if (import.meta.server) return
    try {
      const raw = localStorage.getItem(buildStorageKey(vehicleId))
      if (!raw) return
      const saved = JSON.parse(raw) as Array<{ id: StepId; completed: boolean; skipped: boolean }>
      if (!Array.isArray(saved)) return

      for (const entry of saved) {
        const step = steps.value.find((s) => s.id === entry.id)
        if (step) {
          step.completed = entry.completed
          step.skipped = entry.skipped
        }
      }
      currentStep.value = findFirstIncompleteRequired(steps.value)
    } catch {
      // Corrupt data — ignore and use defaults
    }
  }

  function saveToStorage(): void {
    if (import.meta.server) return
    try {
      const payload = steps.value.map(({ id, completed, skipped }) => ({ id, completed, skipped }))
      localStorage.setItem(buildStorageKey(vehicleId), JSON.stringify(payload))
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  // Load persisted state on init
  loadFromStorage()

  // Auto-save on any step change
  watch(steps, saveToStorage, { deep: true })

  // --- Computed progress -----------------------------------------------------

  const overallProgress = computed<number>(() => {
    const required = steps.value.filter((s) => s.required)
    if (required.length === 0) return 100
    const completed = required.filter((s) => s.completed).length
    return Math.round((completed / required.length) * 100)
  })

  const isComplete = computed<boolean>(() =>
    steps.value.filter((s) => s.required).every((s) => s.completed),
  )

  // --- Step management -------------------------------------------------------

  function completeStep(stepId: StepId): void {
    const step = steps.value.find((s) => s.id === stepId)
    if (!step) return
    step.completed = true
    step.skipped = false
    currentStep.value = findFirstIncompleteRequired(steps.value)
  }

  function skipStep(stepId: StepId): void {
    const step = steps.value.find((s) => s.id === stepId)
    if (!step || step.required) return
    step.skipped = true
    step.completed = false
    currentStep.value = findFirstIncompleteRequired(steps.value)
  }

  function resetStep(stepId: StepId): void {
    const step = steps.value.find((s) => s.id === stepId)
    if (!step) return
    step.completed = false
    step.skipped = false
    currentStep.value = findFirstIncompleteRequired(steps.value)
  }

  function goToStep(stepId: StepId): void {
    currentStep.value = stepId
  }

  // --- Validators ------------------------------------------------------------

  function validateBasicInfo(form: { brand: string; model: string; year: number | null }): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const maxYear = new Date().getFullYear() + 1

    if (!form.brand.trim()) errors.push('onboarding.errors.brandRequired')
    if (!form.model.trim()) errors.push('onboarding.errors.modelRequired')
    if (form.year === null) {
      errors.push('onboarding.errors.yearRequired')
    } else if (form.year < MIN_YEAR || form.year > maxYear) {
      errors.push('onboarding.errors.yearOutOfRange')
    }

    return { valid: errors.length === 0, errors }
  }

  function validatePhotos(
    files: File[],
    existingCount: number,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const total = files.length + existingCount

    if (total < MIN_PHOTOS) errors.push('onboarding.errors.minPhotos')

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push('onboarding.errors.photoTooLarge')
        break // report once
      }
    }

    // Note: dimension checks are async — use validatePhotoQuality for per-file checks
    return { valid: errors.length === 0, errors }
  }

  function validateDescription(text: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const len = text.trim().length

    if (len < MIN_DESCRIPTION_LENGTH) errors.push('onboarding.errors.descriptionTooShort')
    if (len > MAX_DESCRIPTION_LENGTH) errors.push('onboarding.errors.descriptionTooLong')

    return { valid: errors.length === 0, errors }
  }

  function validatePrice(price: number | null): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (price === null || price <= 0) errors.push('onboarding.errors.priceRequired')
    else if (price >= MAX_PRICE) errors.push('onboarding.errors.priceTooHigh')

    return { valid: errors.length === 0, errors }
  }

  function validatePhotoQuality(file: File): Promise<PhotoValidation> {
    return new Promise<PhotoValidation>((resolve) => {
      const errors: string[] = []

      if (file.size > MAX_FILE_SIZE) {
        errors.push('onboarding.errors.photoTooLarge')
      }

      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        // SSR fallback — only size check possible
        resolve({ valid: errors.length === 0, errors })
        return
      }

      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
          errors.push('onboarding.errors.photoTooSmall')
        }
        URL.revokeObjectURL(url)
        resolve({ valid: errors.length === 0, errors })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        errors.push('onboarding.errors.photoInvalid')
        resolve({ valid: errors.length === 0, errors })
      }

      img.src = url
    })
  }

  // --- Public API ------------------------------------------------------------

  return {
    steps,
    currentStep,
    overallProgress,
    isComplete,
    completeStep,
    skipStep,
    resetStep,
    goToStep,
    validateBasicInfo,
    validatePhotos,
    validateDescription,
    validatePrice,
    validatePhotoQuality,
  }
}

export type { StepId, OnboardingStep, PhotoValidation }
