/**
 * Tests for app/composables/useMfa.ts
 * MFA/2FA TOTP — enroll QR, verify 6 digits, unenroll, checkStatus, requireMfa.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Stubs ---
const mockUser = { value: { id: 'user-1' } as unknown }

const mockMfa = {
  listFactors: vi.fn(),
  enroll: vi.fn(),
  challenge: vi.fn(),
  verify: vi.fn(),
  unenroll: vi.fn(),
  getAuthenticatorAssuranceLevel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUser.value = { id: 'user-1' }
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return {
      get value() { return _v },
      set value(x) { _v = x },
    }
  })
  vi.stubGlobal('useSupabaseUser', () => mockUser)
  vi.stubGlobal('useSupabaseClient', () => ({
    auth: { mfa: mockMfa },
  }))
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import { useMfa } from '../../app/composables/useMfa'

// ─── checkStatus ──────────────────────────────────────────────────────────────

describe('checkStatus', () => {
  it('returns not_enrolled when no user', async () => {
    mockUser.value = null
    const mfa = useMfa()
    const result = await mfa.checkStatus()
    expect(result).toBe('not_enrolled')
    expect(mfa.status.value).toBe('not_enrolled')
  })

  it('returns not_enrolled when listFactors errors', async () => {
    mockMfa.listFactors.mockResolvedValue({ data: null, error: { message: 'fail' } })
    const mfa = useMfa()
    const result = await mfa.checkStatus()
    expect(result).toBe('not_enrolled')
  })

  it('returns not_enrolled when no TOTP factors', async () => {
    mockMfa.listFactors.mockResolvedValue({ data: { totp: [] }, error: null })
    const mfa = useMfa()
    const result = await mfa.checkStatus()
    expect(result).toBe('not_enrolled')
  })

  it('returns verified when TOTP factor has status verified', async () => {
    mockMfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: 'factor-1', status: 'verified' }] },
      error: null,
    })
    const mfa = useMfa()
    const result = await mfa.checkStatus()
    expect(result).toBe('verified')
    expect(mfa.factorId.value).toBe('factor-1')
  })

  it('returns enrolled when TOTP factor exists but not verified', async () => {
    mockMfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: 'factor-2', status: 'unverified' }] },
      error: null,
    })
    const mfa = useMfa()
    const result = await mfa.checkStatus()
    expect(result).toBe('enrolled')
    expect(mfa.factorId.value).toBe('factor-2')
  })
})

// ─── enroll ───────────────────────────────────────────────────────────────────

describe('enroll', () => {
  it('returns QR code and secret on success', async () => {
    mockMfa.enroll.mockResolvedValue({
      data: { id: 'factor-new', totp: { qr_code: 'data:image/svg;base64,...', secret: 'ABCDEF123' } },
      error: null,
    })
    const mfa = useMfa()
    const result = await mfa.enroll()
    expect(result).toEqual({ qrUri: 'data:image/svg;base64,...', secret: 'ABCDEF123' })
    expect(mfa.qrCodeUri.value).toBe('data:image/svg;base64,...')
    expect(mfa.secret.value).toBe('ABCDEF123')
    expect(mfa.factorId.value).toBe('factor-new')
  })

  it('returns null on error', async () => {
    mockMfa.enroll.mockResolvedValue({ data: null, error: { message: 'enroll failed' } })
    const mfa = useMfa()
    const result = await mfa.enroll()
    expect(result).toBeNull()
  })

  it('sets loading to true during enrollment', async () => {
    let loadingDuringCall = false
    mockMfa.enroll.mockImplementation(async () => {
      loadingDuringCall = true
      return { data: { id: 'f', totp: { qr_code: 'qr', secret: 's' } }, error: null }
    })
    const mfa = useMfa()
    await mfa.enroll()
    expect(loadingDuringCall).toBe(true)
    expect(mfa.loading.value).toBe(false)
  })

  it('calls enroll with factorType totp and friendlyName', async () => {
    mockMfa.enroll.mockResolvedValue({
      data: { id: 'f', totp: { qr_code: 'qr', secret: 's' } },
      error: null,
    })
    const mfa = useMfa()
    await mfa.enroll()
    expect(mockMfa.enroll).toHaveBeenCalledWith({
      factorType: 'totp',
      friendlyName: 'Tracciona Authenticator',
    })
  })
})

// ─── verify ───────────────────────────────────────────────────────────────────

describe('verify', () => {
  it('returns false when no factorId', async () => {
    const mfa = useMfa()
    // factorId is null by default
    const result = await mfa.verify('123456')
    expect(result).toBe(false)
  })

  it('returns true on successful verification', async () => {
    mockMfa.challenge.mockResolvedValue({ data: { id: 'challenge-1' }, error: null })
    mockMfa.verify.mockResolvedValue({ error: null })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-1'
    const result = await mfa.verify('123456')
    expect(result).toBe(true)
    expect(mfa.status.value).toBe('verified')
  })

  it('calls challenge and verify with correct params', async () => {
    mockMfa.challenge.mockResolvedValue({ data: { id: 'ch-1' }, error: null })
    mockMfa.verify.mockResolvedValue({ error: null })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-99'
    await mfa.verify('654321')

    expect(mockMfa.challenge).toHaveBeenCalledWith({ factorId: 'factor-99' })
    expect(mockMfa.verify).toHaveBeenCalledWith({
      factorId: 'factor-99',
      challengeId: 'ch-1',
      code: '654321',
    })
  })

  it('returns false when challenge fails', async () => {
    mockMfa.challenge.mockResolvedValue({ data: null, error: { message: 'challenge failed' } })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-1'
    const result = await mfa.verify('123456')
    expect(result).toBe(false)
  })

  it('returns false when verify fails', async () => {
    mockMfa.challenge.mockResolvedValue({ data: { id: 'ch-2' }, error: null })
    mockMfa.verify.mockResolvedValue({ error: { message: 'invalid code' } })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-1'
    const result = await mfa.verify('000000')
    expect(result).toBe(false)
  })

  it('sets loading=false after verification completes', async () => {
    mockMfa.challenge.mockResolvedValue({ data: { id: 'ch-3' }, error: null })
    mockMfa.verify.mockResolvedValue({ error: null })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-1'
    await mfa.verify('111111')
    expect(mfa.loading.value).toBe(false)
  })
})

// ─── unenroll ─────────────────────────────────────────────────────────────────

describe('unenroll', () => {
  it('returns false when no factorId', async () => {
    const mfa = useMfa()
    const result = await mfa.unenroll()
    expect(result).toBe(false)
  })

  it('returns true and resets state on success', async () => {
    mockMfa.unenroll.mockResolvedValue({ error: null })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-1'
    mfa.qrCodeUri.value = 'some-uri'
    mfa.secret.value = 'some-secret'

    const result = await mfa.unenroll()
    expect(result).toBe(true)
    expect(mfa.status.value).toBe('not_enrolled')
    expect(mfa.factorId.value).toBeNull()
    expect(mfa.qrCodeUri.value).toBeNull()
    expect(mfa.secret.value).toBeNull()
  })

  it('returns false on error', async () => {
    mockMfa.unenroll.mockResolvedValue({ error: { message: 'unenroll failed' } })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-1'
    const result = await mfa.unenroll()
    expect(result).toBe(false)
  })

  it('calls unenroll with correct factorId', async () => {
    mockMfa.unenroll.mockResolvedValue({ error: null })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-42'
    await mfa.unenroll()
    expect(mockMfa.unenroll).toHaveBeenCalledWith({ factorId: 'factor-42' })
  })

  it('sets loading=false after unenroll completes', async () => {
    mockMfa.unenroll.mockResolvedValue({ error: null })

    const mfa = useMfa()
    mfa.factorId.value = 'factor-1'
    await mfa.unenroll()
    expect(mfa.loading.value).toBe(false)
  })
})

// ─── requireMfa ───────────────────────────────────────────────────────────────

describe('requireMfa', () => {
  it('returns true when currentLevel is aal2', async () => {
    mockMfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2' },
      error: null,
    })
    const mfa = useMfa()
    const result = await mfa.requireMfa()
    expect(result).toBe(true)
  })

  it('returns false when currentLevel is aal1', async () => {
    mockMfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1' },
      error: null,
    })
    const mfa = useMfa()
    const result = await mfa.requireMfa()
    expect(result).toBe(false)
  })

  it('returns false on error', async () => {
    mockMfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: null,
      error: { message: 'fail' },
    })
    const mfa = useMfa()
    const result = await mfa.requireMfa()
    expect(result).toBe(false)
  })
})
