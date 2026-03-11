/**
 * POST /api/auth/check-lockout
 *
 * Checks if an email is locked out due to too many failed login attempts.
 * Records each failed attempt server-side.
 * Accepts Turnstile token to bypass lockout (captcha unlock).
 *
 * Body: { email: string, action: 'check' | 'record_failure', turnstileToken?: string }
 * Returns: { locked: boolean, retryAfterSeconds?: number, attemptsRemaining?: number }
 */

import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { validateBody } from '../../utils/validateBody'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 min
const LOCKOUT_MS = 30 * 60 * 1000 // 30 min

const bodySchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim()),
  action: z.enum(['check', 'record_failure']),
  turnstileToken: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { email, action, turnstileToken } = await validateBody(event, bodySchema)

  const client = serverSupabaseServiceRole(event)

  // If turnstile token provided, verify it and unlock
  if (turnstileToken && action === 'check') {
    const verified = await verifyTurnstile(turnstileToken)
    if (verified) {
      // Reset lockout
      await client.from('login_attempts').delete().eq('email', email)
      return { locked: false, attemptsRemaining: MAX_ATTEMPTS }
    }
  }

  if (action === 'check') {
    const { data } = await client
      .from('login_attempts')
      .select('attempts, first_attempt_at, locked_until')
      .eq('email', email)
      .single()

    if (!data) {
      return { locked: false, attemptsRemaining: MAX_ATTEMPTS }
    }

    // Check if currently locked
    if (data.locked_until) {
      const lockedUntil = new Date(data.locked_until).getTime()
      const now = Date.now()
      if (now < lockedUntil) {
        const retryAfterSeconds = Math.ceil((lockedUntil - now) / 1000)
        return { locked: true, retryAfterSeconds, attemptsRemaining: 0 }
      }
      // Lock expired — reset
      await client.from('login_attempts').delete().eq('email', email)
      return { locked: false, attemptsRemaining: MAX_ATTEMPTS }
    }

    // Check if window expired
    const firstAttempt = new Date(data.first_attempt_at).getTime()
    if (Date.now() - firstAttempt > WINDOW_MS) {
      await client.from('login_attempts').delete().eq('email', email)
      return { locked: false, attemptsRemaining: MAX_ATTEMPTS }
    }

    return { locked: false, attemptsRemaining: Math.max(0, MAX_ATTEMPTS - data.attempts) }
  }

  // action === 'record_failure'
  const { data: existing } = await client
    .from('login_attempts')
    .select('attempts, first_attempt_at')
    .eq('email', email)
    .single()

  const now = new Date().toISOString()

  if (!existing) {
    await client.from('login_attempts').insert({
      email,
      attempts: 1,
      first_attempt_at: now,
      updated_at: now,
    })
    return { locked: false, attemptsRemaining: MAX_ATTEMPTS - 1 }
  }

  // Window expired — reset
  const firstAttempt = new Date(existing.first_attempt_at).getTime()
  if (Date.now() - firstAttempt > WINDOW_MS) {
    await client.from('login_attempts').upsert({
      email,
      attempts: 1,
      first_attempt_at: now,
      locked_until: null,
      updated_at: now,
    })
    return { locked: false, attemptsRemaining: MAX_ATTEMPTS - 1 }
  }

  const newAttempts = existing.attempts + 1

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MS).toISOString()
    await client.from('login_attempts').upsert({
      email,
      attempts: newAttempts,
      first_attempt_at: existing.first_attempt_at,
      locked_until: lockedUntil,
      updated_at: now,
    })
    return { locked: true, retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000), attemptsRemaining: 0 }
  }

  await client.from('login_attempts').upsert({
    email,
    attempts: newAttempts,
    first_attempt_at: existing.first_attempt_at,
    locked_until: null,
    updated_at: now,
  })
  return { locked: false, attemptsRemaining: MAX_ATTEMPTS - newAttempts }
})

async function verifyTurnstile(token: string): Promise<boolean> {
  const config = useRuntimeConfig()
  const secret = config.turnstileSecretKey as string
  if (!secret) return false

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const result = (await response.json()) as { success: boolean }
    return result.success === true
  } catch {
    return false
  }
}
