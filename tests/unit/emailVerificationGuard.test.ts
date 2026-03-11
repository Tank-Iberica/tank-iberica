import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Unit tests for email verification guard logic
// Tests the pure guard function: isEmailVerified
// ---------------------------------------------------------------------------

interface SupabaseUser {
  id: string
  email: string
  email_confirmed_at: string | null
}

/** Mirrors the emailVerified computed in useDashboardNuevoVehiculo */
function isEmailVerified(user: SupabaseUser | null): boolean {
  return !!user?.email_confirmed_at
}

/** Mirrors the submit guard outcome */
function canPublish(
  user: SupabaseUser | null,
  canPublishByPlan: boolean,
  hasBrandModel: boolean,
): { allowed: boolean; errorKey?: string } {
  if (!isEmailVerified(user)) {
    return { allowed: false, errorKey: 'dashboard.vehicles.emailVerificationRequired' }
  }
  if (!canPublishByPlan) {
    return { allowed: false, errorKey: 'dashboard.vehicles.limitReached' }
  }
  if (!hasBrandModel) {
    return { allowed: false, errorKey: 'dashboard.vehicles.requiredFields' }
  }
  return { allowed: true }
}

// ---- isEmailVerified -------------------------------------------------------

describe('emailVerificationGuard — isEmailVerified', () => {
  it('returns false when user is null', () => {
    expect(isEmailVerified(null)).toBe(false)
  })

  it('returns false when email_confirmed_at is null', () => {
    const user: SupabaseUser = { id: 'u1', email: 'a@b.com', email_confirmed_at: null }
    expect(isEmailVerified(user)).toBe(false)
  })

  it('returns false when email_confirmed_at is empty string', () => {
    const user: SupabaseUser = { id: 'u1', email: 'a@b.com', email_confirmed_at: '' }
    expect(isEmailVerified(user)).toBe(false)
  })

  it('returns true when email_confirmed_at has a timestamp', () => {
    const user: SupabaseUser = {
      id: 'u1',
      email: 'a@b.com',
      email_confirmed_at: '2026-01-15T10:00:00Z',
    }
    expect(isEmailVerified(user)).toBe(true)
  })

  it('returns true regardless of how recent the confirmation is', () => {
    const user: SupabaseUser = {
      id: 'u1',
      email: 'a@b.com',
      email_confirmed_at: '2020-01-01T00:00:00Z',
    }
    expect(isEmailVerified(user)).toBe(true)
  })
})

// ---- canPublish (guard priority) -------------------------------------------

describe('emailVerificationGuard — canPublish priority', () => {
  const verifiedUser: SupabaseUser = {
    id: 'u1',
    email: 'a@b.com',
    email_confirmed_at: '2026-01-01T00:00:00Z',
  }
  const unverifiedUser: SupabaseUser = { id: 'u2', email: 'b@b.com', email_confirmed_at: null }

  it('blocks with emailVerificationRequired when user email not confirmed', () => {
    const result = canPublish(unverifiedUser, true, true)
    expect(result.allowed).toBe(false)
    expect(result.errorKey).toBe('dashboard.vehicles.emailVerificationRequired')
  })

  it('email check fires BEFORE plan limit check', () => {
    // Even if plan is over the limit, email check fires first
    const result = canPublish(unverifiedUser, false, true)
    expect(result.errorKey).toBe('dashboard.vehicles.emailVerificationRequired')
  })

  it('email check fires BEFORE required fields check', () => {
    const result = canPublish(unverifiedUser, true, false)
    expect(result.errorKey).toBe('dashboard.vehicles.emailVerificationRequired')
  })

  it('blocks with limitReached when plan limit exceeded (email ok)', () => {
    const result = canPublish(verifiedUser, false, true)
    expect(result.allowed).toBe(false)
    expect(result.errorKey).toBe('dashboard.vehicles.limitReached')
  })

  it('blocks with requiredFields when brand/model missing (email + plan ok)', () => {
    const result = canPublish(verifiedUser, true, false)
    expect(result.allowed).toBe(false)
    expect(result.errorKey).toBe('dashboard.vehicles.requiredFields')
  })

  it('allows publish when all conditions met', () => {
    const result = canPublish(verifiedUser, true, true)
    expect(result.allowed).toBe(true)
    expect(result.errorKey).toBeUndefined()
  })

  it('blocks null user (not logged in) with emailVerificationRequired', () => {
    const result = canPublish(null, true, true)
    expect(result.allowed).toBe(false)
    expect(result.errorKey).toBe('dashboard.vehicles.emailVerificationRequired')
  })
})
