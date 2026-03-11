import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ─── Mock package imports ──────────────────────────────────────────────────────

const mockErrors = vi.fn().mockReturnValue({ value: {} })

vi.mock('vee-validate', () => ({
  useForm: vi.fn(() => ({
    errors: mockErrors(),
    isSubmitting: { value: false },
    meta: { value: { valid: true } },
    values: { value: {} },
    handleSubmit: (cb: (v: unknown) => unknown) => cb,
    defineField: vi.fn((name: string) => [{ value: '' }, { name }]),
    resetForm: vi.fn(),
    setFieldValue: vi.fn(),
    setFieldError: vi.fn(),
  })),
}))

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: (s: unknown) => s,
}))

// ─── Import under test ─────────────────────────────────────────────────────────

import { useFormValidation } from '../../app/composables/useFormValidation'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => `[${key}]` }))
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() { return fn() },
  }))
  // Reset errors to empty by default
  mockErrors.mockReturnValue({ value: {} })
})

// ─── Basic API ────────────────────────────────────────────────────────────────

describe('useFormValidation', () => {
  it('returns form object', () => {
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(c.form).toBeDefined()
    expect(c.errors).toBeDefined()
    expect(c.onSubmit).toBeDefined()
  })

  it('exposes isSubmitting and meta', () => {
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(c.isSubmitting).toBeDefined()
    expect(c.meta).toBeDefined()
  })

  it('exposes resetForm and setFieldValue', () => {
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(typeof c.resetForm).toBe('function')
    expect(typeof c.setFieldValue).toBe('function')
  })

  it('exposes setFieldError', () => {
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(typeof c.setFieldError).toBe('function')
  })

  it('exposes defineField', () => {
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(typeof c.defineField).toBe('function')
  })

  it('calls options.onSubmit when form is submitted', async () => {
    const schema = z.object({ email: z.string() })
    const onSubmitSpy = vi.fn()
    const c = useFormValidation(schema, { onSubmit: onSubmitSpy })
    await c.onSubmit({ email: 'test@example.com' })
    expect(onSubmitSpy).toHaveBeenCalledWith({ email: 'test@example.com' })
  })
})

// ─── translatedErrors ─────────────────────────────────────────────────────────

describe('translatedErrors', () => {
  it('returns empty object when no errors', () => {
    mockErrors.mockReturnValue({ value: {} })
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(c.translatedErrors.value).toEqual({})
  })

  it('translates error keys that contain a dot', () => {
    mockErrors.mockReturnValue({ value: { email: 'validation.required' } })
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    // t('validation.required') → '[validation.required]' from our stub
    expect(c.translatedErrors.value.email).toBe('[validation.required]')
  })

  it('returns raw error for messages without a dot', () => {
    mockErrors.mockReturnValue({ value: { name: 'Required' } })
    const schema = z.object({ name: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(c.translatedErrors.value.name).toBe('Required')
  })

  it('skips undefined error values', () => {
    mockErrors.mockReturnValue({ value: { email: undefined } })
    const schema = z.object({ email: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(c.translatedErrors.value).not.toHaveProperty('email')
  })

  it('handles multiple errors', () => {
    mockErrors.mockReturnValue({
      value: { email: 'validation.email', name: 'validation.required' },
    })
    const schema = z.object({ email: z.string(), name: z.string() })
    const c = useFormValidation(schema, { onSubmit: vi.fn() })
    expect(c.translatedErrors.value.email).toBe('[validation.email]')
    expect(c.translatedErrors.value.name).toBe('[validation.required]')
  })
})
