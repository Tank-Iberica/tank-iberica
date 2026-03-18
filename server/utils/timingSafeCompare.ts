import { timingSafeEqual } from 'node:crypto'

/**
 * Timing-safe string comparison for secrets, tokens, and API keys.
 * Prevents timing attacks by ensuring constant-time comparison
 * regardless of where the strings differ.
 *
 * Returns false for null/undefined/empty strings without throwing.
 */
export function timingSafeCompare(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false
  if (a.length !== b.length) return false

  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}
