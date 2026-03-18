/**
 * Tests for #89 — Form validation library (Zod schemas)
 *
 * Validates all Zod schemas used across forms:
 * - passwordResetSchema
 * - newPasswordSchema
 * - changePasswordSchema
 * - deleteAccountSchema
 * - inspectionRequestSchema
 * - advertisementContactSchema
 */
import { describe, it, expect } from 'vitest'
import {
  passwordResetSchema,
  newPasswordSchema,
  changePasswordSchema,
  deleteAccountSchema,
  inspectionRequestSchema,
  advertisementContactSchema,
} from '~/utils/schemas'

// ── passwordResetSchema ─────────────────────────────────────────────────────

describe('passwordResetSchema (#89)', () => {
  it('accepts valid email', () => {
    const result = passwordResetSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = passwordResetSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = passwordResetSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})

// ── newPasswordSchema ───────────────────────────────────────────────────────

describe('newPasswordSchema (#89)', () => {
  it('accepts matching passwords >= 6 chars', () => {
    const result = newPasswordSchema.safeParse({
      password: 'abcdef',
      confirmPassword: 'abcdef',
    })
    expect(result.success).toBe(true)
  })

  it('rejects password < 6 chars', () => {
    const result = newPasswordSchema.safeParse({
      password: 'abc',
      confirmPassword: 'abc',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = newPasswordSchema.safeParse({
      password: 'abcdef',
      confirmPassword: 'abcxyz',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('confirmPassword')
    }
  })

  it('rejects empty confirm password', () => {
    const result = newPasswordSchema.safeParse({
      password: 'abcdef',
      confirmPassword: '',
    })
    expect(result.success).toBe(false)
  })
})

// ── changePasswordSchema ────────────────────────────────────────────────────

describe('changePasswordSchema (#89)', () => {
  it('accepts matching passwords >= 8 chars', () => {
    const result = changePasswordSchema.safeParse({
      newPassword: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    })
    expect(result.success).toBe(true)
  })

  it('rejects password < 8 chars', () => {
    const result = changePasswordSchema.safeParse({
      newPassword: 'abc',
      confirmPassword: 'abc',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = changePasswordSchema.safeParse({
      newPassword: 'abcdefgh',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })
})

// ── deleteAccountSchema ─────────────────────────────────────────────────────

describe('deleteAccountSchema (#89)', () => {
  it('accepts "ELIMINAR"', () => {
    const result = deleteAccountSchema.safeParse({ confirmation: 'ELIMINAR' })
    expect(result.success).toBe(true)
  })

  it('rejects wrong text', () => {
    const result = deleteAccountSchema.safeParse({ confirmation: 'eliminar' })
    expect(result.success).toBe(false)
  })

  it('rejects empty', () => {
    const result = deleteAccountSchema.safeParse({ confirmation: '' })
    expect(result.success).toBe(false)
  })

  it('provides deleteConfirmation error message', () => {
    const result = deleteAccountSchema.safeParse({ confirmation: 'wrong' })
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.deleteConfirmation')
    }
  })
})

// ── inspectionRequestSchema ─────────────────────────────────────────────────

describe('inspectionRequestSchema (#89)', () => {
  const validData = {
    name: 'Juan García',
    email: 'juan@example.com',
    phone: '+34 612 345 678',
  }

  it('accepts valid required fields', () => {
    const result = inspectionRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('accepts with optional fields', () => {
    const result = inspectionRequestSchema.safeParse({
      ...validData,
      preferredDate: '2026-04-01',
      notes: 'Quiero ver el camión por la mañana',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = inspectionRequestSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = inspectionRequestSchema.safeParse({ ...validData, email: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects empty phone', () => {
    const result = inspectionRequestSchema.safeParse({ ...validData, phone: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid phone format', () => {
    const result = inspectionRequestSchema.safeParse({ ...validData, phone: 'abc' })
    expect(result.success).toBe(false)
  })
})

// ── advertisementContactSchema ──────────────────────────────────────────────

describe('advertisementContactSchema (#89)', () => {
  const validData = {
    contactName: 'María López',
    contactEmail: 'maria@example.com',
    contactPhone: '+34 699 888 777',
    contactPreference: 'email' as const,
    termsAccepted: true as const,
  }

  it('accepts valid data', () => {
    const result = advertisementContactSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects empty contact name', () => {
    const result = advertisementContactSchema.safeParse({ ...validData, contactName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = advertisementContactSchema.safeParse({ ...validData, contactEmail: 'bad' })
    expect(result.success).toBe(false)
  })

  it('rejects empty phone', () => {
    const result = advertisementContactSchema.safeParse({ ...validData, contactPhone: '' })
    expect(result.success).toBe(false)
  })

  it('rejects terms not accepted', () => {
    const result = advertisementContactSchema.safeParse({ ...validData, termsAccepted: false })
    expect(result.success).toBe(false)
  })

  it('accepts all contact preference values', () => {
    for (const pref of ['email', 'phone', 'whatsapp'] as const) {
      const result = advertisementContactSchema.safeParse({ ...validData, contactPreference: pref })
      expect(result.success).toBe(true)
    }
  })

  it('provides termsRequired error message', () => {
    const result = advertisementContactSchema.safeParse({ ...validData, termsAccepted: false })
    if (!result.success) {
      const termsIssue = result.error.issues.find((i) => i.path.includes('termsAccepted'))
      expect(termsIssue?.message).toBe('validation.termsRequired')
    }
  })

  it('accepts phone with various formats', () => {
    const phones = ['+34612345678', '612 345 678', '+1 (555) 123-4567', '00-34-612345678']
    for (const ph of phones) {
      const result = advertisementContactSchema.safeParse({ ...validData, contactPhone: ph })
      expect(result.success).toBe(true)
    }
  })
})
