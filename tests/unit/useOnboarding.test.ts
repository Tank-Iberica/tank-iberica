import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOnboarding } from '../../app/composables/useOnboarding'

// ─── localStorage stub ────────────────────────────────────────────────────────

const localStorageStore = new Map<string, string>()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageStore.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    setItem: (key: string, val: string) => localStorageStore.set(key, val),
    removeItem: (key: string) => localStorageStore.delete(key),
    clear: () => localStorageStore.clear(),
  })
  vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:mock'), revokeObjectURL: vi.fn() })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('has 7 steps', () => {
    const c = useOnboarding()
    expect(c.steps.value).toHaveLength(7)
  })

  it('all steps start incomplete', () => {
    const c = useOnboarding()
    expect(c.steps.value.every((s) => !s.completed)).toBe(true)
  })

  it('all steps start not skipped', () => {
    const c = useOnboarding()
    expect(c.steps.value.every((s) => !s.skipped)).toBe(true)
  })

  it('currentStep starts as "basic_info"', () => {
    const c = useOnboarding()
    expect(c.currentStep.value).toBe('basic_info')
  })

  it('overallProgress starts as 0', () => {
    const c = useOnboarding()
    expect(c.overallProgress.value).toBe(0)
  })

  it('isComplete starts as false', () => {
    const c = useOnboarding()
    expect(c.isComplete.value).toBe(false)
  })

  it('attributes step is not required', () => {
    const c = useOnboarding()
    const attrStep = c.steps.value.find((s) => s.id === 'attributes')
    expect(attrStep?.required).toBe(false)
  })

  it('basic_info step is required', () => {
    const c = useOnboarding()
    const step = c.steps.value.find((s) => s.id === 'basic_info')
    expect(step?.required).toBe(true)
  })
})

// ─── completeStep ─────────────────────────────────────────────────────────────

describe('completeStep', () => {
  it('marks step as completed', () => {
    const c = useOnboarding()
    c.completeStep('basic_info')
    const step = c.steps.value.find((s) => s.id === 'basic_info')
    expect(step?.completed).toBe(true)
  })

  it('sets skipped to false when completing', () => {
    const c = useOnboarding()
    c.steps.value.find((s) => s.id === 'attributes')!.skipped = true
    c.completeStep('attributes')
    expect(c.steps.value.find((s) => s.id === 'attributes')?.skipped).toBe(false)
  })

  it('advances currentStep to next incomplete required step', () => {
    const c = useOnboarding()
    c.completeStep('basic_info')
    expect(c.currentStep.value).toBe('photos')
  })

  it('does nothing for unknown stepId', () => {
    const c = useOnboarding()
    // @ts-expect-error - testing unknown step
    c.completeStep('nonexistent')
    expect(c.steps.value.every((s) => !s.completed)).toBe(true)
  })

  it('after completing all required steps, currentStep becomes "preview"', () => {
    const c = useOnboarding()
    const requiredIds = c.steps.value.filter((s) => s.required).map((s) => s.id)
    for (const id of requiredIds) {
      c.completeStep(id)
    }
    // findFirstIncompleteRequired returns 'preview' when none found
    expect(c.currentStep.value).toBe('preview')
  })
})

// ─── skipStep ─────────────────────────────────────────────────────────────────

describe('skipStep', () => {
  it('marks optional step as skipped', () => {
    const c = useOnboarding()
    c.skipStep('attributes')
    expect(c.steps.value.find((s) => s.id === 'attributes')?.skipped).toBe(true)
  })

  it('does NOT skip required step', () => {
    const c = useOnboarding()
    c.skipStep('basic_info') // required — should be ignored
    expect(c.steps.value.find((s) => s.id === 'basic_info')?.skipped).toBe(false)
  })

  it('sets completed to false when skipping', () => {
    const c = useOnboarding()
    c.steps.value.find((s) => s.id === 'attributes')!.completed = true
    c.skipStep('attributes')
    expect(c.steps.value.find((s) => s.id === 'attributes')?.completed).toBe(false)
  })
})

// ─── resetStep ────────────────────────────────────────────────────────────────

describe('resetStep', () => {
  it('resets completed to false', () => {
    const c = useOnboarding()
    c.completeStep('basic_info')
    c.resetStep('basic_info')
    expect(c.steps.value.find((s) => s.id === 'basic_info')?.completed).toBe(false)
  })

  it('resets skipped to false', () => {
    const c = useOnboarding()
    c.skipStep('attributes')
    c.resetStep('attributes')
    expect(c.steps.value.find((s) => s.id === 'attributes')?.skipped).toBe(false)
  })

  it('does nothing for unknown stepId', () => {
    const c = useOnboarding()
    // @ts-expect-error - testing unknown step
    c.resetStep('nonexistent')
    expect(c.steps.value.every((s) => !s.completed)).toBe(true)
  })
})

// ─── goToStep ─────────────────────────────────────────────────────────────────

describe('goToStep', () => {
  it('sets currentStep to given id', () => {
    const c = useOnboarding()
    c.goToStep('price')
    expect(c.currentStep.value).toBe('price')
  })

  it('can go back to a previous step', () => {
    const c = useOnboarding()
    c.completeStep('basic_info') // advances to photos
    c.goToStep('basic_info')
    expect(c.currentStep.value).toBe('basic_info')
  })
})

// ─── validateBasicInfo ────────────────────────────────────────────────────────

describe('validateBasicInfo', () => {
  it('returns valid for complete basic info', () => {
    const c = useOnboarding()
    const result = c.validateBasicInfo({ brand: 'Volvo', model: 'FH16', year: 2020 })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error when brand is empty', () => {
    const c = useOnboarding()
    const result = c.validateBasicInfo({ brand: '', model: 'FH16', year: 2020 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.brandRequired')
  })

  it('returns error when brand is whitespace only', () => {
    const c = useOnboarding()
    const result = c.validateBasicInfo({ brand: '   ', model: 'FH16', year: 2020 })
    expect(result.errors).toContain('onboarding.errors.brandRequired')
  })

  it('returns error when model is empty', () => {
    const c = useOnboarding()
    const result = c.validateBasicInfo({ brand: 'Volvo', model: '', year: 2020 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.modelRequired')
  })

  it('returns error when year is null', () => {
    const c = useOnboarding()
    const result = c.validateBasicInfo({ brand: 'Volvo', model: 'FH16', year: null })
    expect(result.errors).toContain('onboarding.errors.yearRequired')
  })

  it('returns error when year is below 1970', () => {
    const c = useOnboarding()
    const result = c.validateBasicInfo({ brand: 'Volvo', model: 'FH16', year: 1969 })
    expect(result.errors).toContain('onboarding.errors.yearOutOfRange')
  })

  it('returns error when year exceeds current year + 1', () => {
    const c = useOnboarding()
    const futureYear = new Date().getFullYear() + 2
    const result = c.validateBasicInfo({ brand: 'Volvo', model: 'FH16', year: futureYear })
    expect(result.errors).toContain('onboarding.errors.yearOutOfRange')
  })

  it('accepts year = current year + 1', () => {
    const c = useOnboarding()
    const nextYear = new Date().getFullYear() + 1
    const result = c.validateBasicInfo({ brand: 'Volvo', model: 'FH16', year: nextYear })
    expect(result.valid).toBe(true)
  })

  it('can return multiple errors at once', () => {
    const c = useOnboarding()
    const result = c.validateBasicInfo({ brand: '', model: '', year: null })
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── validatePhotos ───────────────────────────────────────────────────────────

describe('validatePhotos', () => {
  function makeFile(sizeBytes = 1024): File {
    const content = 'x'.repeat(sizeBytes)
    return new File([content], 'photo.jpg', { type: 'image/jpeg' })
  }

  it('returns valid when total photos >= 3', () => {
    const c = useOnboarding()
    const files = [makeFile(), makeFile(), makeFile()]
    const result = c.validatePhotos(files, 0)
    expect(result.valid).toBe(true)
  })

  it('accepts existing count toward total', () => {
    const c = useOnboarding()
    const files = [makeFile()]
    const result = c.validatePhotos(files, 2) // 1 new + 2 existing = 3 total
    expect(result.valid).toBe(true)
  })

  it('returns error when total < 3', () => {
    const c = useOnboarding()
    const result = c.validatePhotos([makeFile()], 0)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.minPhotos')
  })

  it('returns error when file exceeds 10 MB', () => {
    const c = useOnboarding()
    const bigFile = makeFile(11 * 1024 * 1024) // 11 MB
    const files = [makeFile(), makeFile(), bigFile]
    const result = c.validatePhotos(files, 0)
    expect(result.errors).toContain('onboarding.errors.photoTooLarge')
  })

  it('reports oversized error at most once', () => {
    const c = useOnboarding()
    const bigFile = makeFile(11 * 1024 * 1024)
    const result = c.validatePhotos([bigFile, bigFile, bigFile], 0)
    const sizeErrors = result.errors.filter((e) => e === 'onboarding.errors.photoTooLarge')
    expect(sizeErrors).toHaveLength(1)
  })
})

// ─── validateDescription ──────────────────────────────────────────────────────

describe('validateDescription', () => {
  it('returns valid for description of 100+ chars', () => {
    const c = useOnboarding()
    const text = 'A'.repeat(100)
    const result = c.validateDescription(text)
    expect(result.valid).toBe(true)
  })

  it('returns error for description shorter than 100 chars', () => {
    const c = useOnboarding()
    const result = c.validateDescription('Short')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.descriptionTooShort')
  })

  it('returns error for description longer than 5000 chars', () => {
    const c = useOnboarding()
    const result = c.validateDescription('A'.repeat(5001))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.descriptionTooLong')
  })

  it('trims whitespace before checking length', () => {
    const c = useOnboarding()
    const result = c.validateDescription('   ' + 'A'.repeat(100) + '   ')
    expect(result.valid).toBe(true)
  })

  it('empty string is invalid', () => {
    const c = useOnboarding()
    const result = c.validateDescription('')
    expect(result.valid).toBe(false)
  })
})

// ─── validatePrice ────────────────────────────────────────────────────────────

describe('validatePrice', () => {
  it('returns valid for positive price', () => {
    const c = useOnboarding()
    const result = c.validatePrice(50000)
    expect(result.valid).toBe(true)
  })

  it('returns error for null price', () => {
    const c = useOnboarding()
    const result = c.validatePrice(null)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.priceRequired')
  })

  it('returns error for price of 0', () => {
    const c = useOnboarding()
    const result = c.validatePrice(0)
    expect(result.errors).toContain('onboarding.errors.priceRequired')
  })

  it('returns error for negative price', () => {
    const c = useOnboarding()
    const result = c.validatePrice(-100)
    expect(result.errors).toContain('onboarding.errors.priceRequired')
  })

  it('returns error for price >= 10,000,000', () => {
    const c = useOnboarding()
    const result = c.validatePrice(10_000_000)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.priceTooHigh')
  })

  it('returns valid for price just below MAX', () => {
    const c = useOnboarding()
    const result = c.validatePrice(9_999_999)
    expect(result.valid).toBe(true)
  })
})

// ─── validatePhotoQuality (SSR path) ──────────────────────────────────────────

describe('validatePhotoQuality — SSR/size checks', () => {
  it('resolves with valid result for small file when window is undefined', async () => {
    vi.stubGlobal('window', undefined)
    const c = useOnboarding()
    const file = new File(['x'.repeat(100)], 'photo.jpg', { type: 'image/jpeg' })
    const result = await c.validatePhotoQuality(file)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('resolves with error for oversized file in SSR path', async () => {
    vi.stubGlobal('window', undefined)
    const c = useOnboarding()
    const bigContent = 'x'.repeat(11 * 1024 * 1024)
    const file = new File([bigContent], 'big.jpg', { type: 'image/jpeg' })
    const result = await c.validatePhotoQuality(file)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.photoTooLarge')
  })
})

// ─── Persistence (localStorage) ───────────────────────────────────────────────

describe('persistence', () => {
  it('loads completed steps from localStorage', () => {
    const payload = JSON.stringify([
      { id: 'basic_info', completed: true, skipped: false },
      { id: 'photos', completed: false, skipped: false },
    ])
    localStorageStore.set('tracciona_onboarding_new', payload)

    const c = useOnboarding()
    expect(c.steps.value.find((s) => s.id === 'basic_info')?.completed).toBe(true)
  })

  it('ignores corrupt localStorage data', () => {
    localStorageStore.set('tracciona_onboarding_new', 'not-json')
    const c = useOnboarding() // should not throw
    expect(c.steps.value.every((s) => !s.completed)).toBe(true)
  })

  it('sets currentStep based on loaded data', () => {
    const payload = JSON.stringify([
      { id: 'basic_info', completed: true, skipped: false },
    ])
    localStorageStore.set('tracciona_onboarding_new', payload)

    const c = useOnboarding()
    // basic_info completed → next required is photos
    expect(c.currentStep.value).toBe('photos')
  })

  it('uses vehicleId in storage key when provided', () => {
    const c = useOnboarding('vehicle-123')
    c.completeStep('basic_info')
    // saveToStorage is called (watch is no-op but saveToStorage is called in completeStep via watch mock noop)
    // We just verify it doesn't throw and the step is marked complete
    expect(c.steps.value.find((s) => s.id === 'basic_info')?.completed).toBe(true)
  })

  it('ignores non-array data in localStorage', () => {
    localStorageStore.set('tracciona_onboarding_new', JSON.stringify({ not: 'array' }))
    const c = useOnboarding()
    // Should not throw and steps remain default
    expect(c.steps.value.every((s) => !s.completed)).toBe(true)
  })

  it('loads skipped state from storage', () => {
    const payload = JSON.stringify([
      { id: 'attributes', completed: false, skipped: true },
    ])
    localStorageStore.set('tracciona_onboarding_new', payload)
    const c = useOnboarding()
    expect(c.steps.value.find((s) => s.id === 'attributes')?.skipped).toBe(true)
  })

  it('ignores entries with unknown step ids', () => {
    const payload = JSON.stringify([
      { id: 'nonexistent_step', completed: true, skipped: false },
    ])
    localStorageStore.set('tracciona_onboarding_new', payload)
    const c = useOnboarding()
    expect(c.steps.value.every((s) => !s.completed)).toBe(true)
  })
})

// ─── overallProgress / isComplete ─────────────────────────────────────────────

describe('overallProgress', () => {
  beforeEach(() => {
    // Override with getter-based computed for reactivity
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
    vi.stubGlobal('watch', vi.fn())
  })

  it('returns 0 when no steps completed', () => {
    const c = useOnboarding()
    expect(c.overallProgress.value).toBe(0)
  })

  it('returns partial progress after some steps', () => {
    const c = useOnboarding()
    c.completeStep('basic_info')
    // 1 of 6 required steps = ~17%
    expect(c.overallProgress.value).toBeGreaterThan(0)
    expect(c.overallProgress.value).toBeLessThan(100)
  })

  it('returns 100 when all required steps completed', () => {
    const c = useOnboarding()
    const requiredIds = c.steps.value.filter((s: { required: boolean; id: string }) => s.required).map((s: { id: string }) => s.id)
    for (const id of requiredIds) {
      c.completeStep(id)
    }
    expect(c.overallProgress.value).toBe(100)
  })

  it('does not count optional steps in progress calculation', () => {
    const c = useOnboarding()
    c.skipStep('attributes') // optional step — should not affect progress
    expect(c.overallProgress.value).toBe(0)
  })
})

describe('isComplete', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
    vi.stubGlobal('watch', vi.fn())
  })

  it('returns false when some required steps incomplete', () => {
    const c = useOnboarding()
    c.completeStep('basic_info')
    expect(c.isComplete.value).toBe(false)
  })

  it('returns true when all required steps completed', () => {
    const c = useOnboarding()
    const requiredIds = c.steps.value.filter((s: { required: boolean; id: string }) => s.required).map((s: { id: string }) => s.id)
    for (const id of requiredIds) {
      c.completeStep(id)
    }
    expect(c.isComplete.value).toBe(true)
  })

  it('ignores optional steps — true even if optional not completed', () => {
    const c = useOnboarding()
    const requiredIds = c.steps.value.filter((s: { required: boolean; id: string }) => s.required).map((s: { id: string }) => s.id)
    for (const id of requiredIds) {
      c.completeStep(id)
    }
    // attributes is optional and NOT completed
    expect(c.steps.value.find((s: { id: string }) => s.id === 'attributes')?.completed).toBe(false)
    expect(c.isComplete.value).toBe(true)
  })
})

// ─── validatePhotoQuality with Image mock ───────────────────────────────────

describe('validatePhotoQuality — browser path', () => {
  it('resolves valid for properly sized image', async () => {
    const mockImg = { onload: null as unknown, onerror: null as unknown, src: '', width: 0, height: 0 }
    vi.stubGlobal('Image', class {
      onload: unknown = null
      onerror: unknown = null
      src = ''
      width = 0
      height = 0
      constructor() {
        Object.assign(this, mockImg)
        setTimeout(() => {
          this.width = 1200
          this.height = 900
          if (typeof this.onload === 'function') this.onload()
        }, 0)
      }
    })
    vi.stubGlobal('window', {})

    const c = useOnboarding()
    const file = new File(['x'.repeat(100)], 'photo.jpg', { type: 'image/jpeg' })
    const result = await c.validatePhotoQuality(file)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('reports photoTooSmall for undersized image', async () => {
    vi.stubGlobal('Image', class {
      onload: unknown = null
      onerror: unknown = null
      src = ''
      width = 0
      height = 0
      constructor() {
        setTimeout(() => {
          this.width = 400
          this.height = 300
          if (typeof this.onload === 'function') this.onload()
        }, 0)
      }
    })
    vi.stubGlobal('window', {})

    const c = useOnboarding()
    const file = new File(['x'.repeat(100)], 'photo.jpg', { type: 'image/jpeg' })
    const result = await c.validatePhotoQuality(file)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.photoTooSmall')
  })

  it('reports photoInvalid when image fails to load', async () => {
    vi.stubGlobal('Image', class {
      onload: unknown = null
      onerror: unknown = null
      src = ''
      width = 0
      height = 0
      constructor() {
        setTimeout(() => {
          if (typeof this.onerror === 'function') this.onerror()
        }, 0)
      }
    })
    vi.stubGlobal('window', {})

    const c = useOnboarding()
    const file = new File(['x'.repeat(100)], 'broken.jpg', { type: 'image/jpeg' })
    const result = await c.validatePhotoQuality(file)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('onboarding.errors.photoInvalid')
  })
})
