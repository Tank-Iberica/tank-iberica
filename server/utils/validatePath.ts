/**
 * Path traversal protection utilities.
 *
 * Usage:
 *   import { isSafeSlug, isSafeFilename } from '~~/server/utils/validatePath'
 */

/** Slug: alphanumeric + hyphens only, no path separators or null bytes */
export function isSafeSlug(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && !value.includes('..')
}

/** Filename: no path separators, no null bytes, no traversal sequences */
export function isSafeFilename(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 255 &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('\0') &&
    !value.includes('..') &&
    !/^\./.test(value)
  )
}

/** Private/loopback IP ranges — SSRF protection */
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^0\.0\.0\.0$/,
  /^localhost$/i,
]

export function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(hostname))
}
